import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    // Find the user by customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: subscription.customer as string }
    });

    if (!user) {
      console.error('User not found for customer:', subscription.customer);
      return;
    }

    // Find the subscription plan by price ID
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { stripePriceId: subscription.items.data[0].price.id }
    });

    if (!plan) {
      console.error('Plan not found for price:', subscription.items.data[0].price.id);
      return;
    }

    // Create subscription record
    const subscriptionData = subscription as unknown as Record<string, unknown>;
    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date((subscriptionData.current_period_start as number) * 1000),
        currentPeriodEnd: new Date((subscriptionData.current_period_end as number) * 1000),
        cancelAtPeriodEnd: subscriptionData.cancel_at_period_end as boolean
      }
    });

    console.log(`Subscription created for user ${user.id} with plan ${plan.name}`);

  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const subscriptionData = subscription as unknown as Record<string, unknown>;
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date((subscriptionData.current_period_start as number) * 1000),
        currentPeriodEnd: new Date((subscriptionData.current_period_end as number) * 1000),
        cancelAtPeriodEnd: subscriptionData.cancel_at_period_end as boolean
      }
    });

    console.log(`Subscription updated: ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'canceled',
        cancelledAt: new Date()
      }
    });

    console.log(`Subscription deleted: ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const invoiceData = invoice as unknown as Record<string, unknown>;
    
    if (invoiceData.subscription) {
      // Record payment in payment history
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: invoice.customer as string }
      });

      if (user) {
        await prisma.paymentHistory.create({
          data: {
            userId: user.id,
            amount: ((invoiceData.amount_paid as number) || 0) / 100, // Convert from cents
            currency: invoice.currency.toUpperCase(),
            status: 'succeeded',
            stripePaymentIntentId: invoiceData.payment_intent as string,
            description: (invoiceData.description as string) || 'Subscription payment'
          }
        });

        console.log(`Payment succeeded for user ${user.id}: $${((invoiceData.amount_paid as number) || 0) / 100}`);
      }
    }

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const invoiceData = invoice as unknown as Record<string, unknown>;
    
    if (invoiceData.subscription) {
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: invoice.customer as string }
      });

      if (user) {
        await prisma.paymentHistory.create({
          data: {
            userId: user.id,
            amount: ((invoiceData.amount_due as number) || 0) / 100, // Convert from cents
            currency: invoice.currency.toUpperCase(),
            status: 'failed',
            description: 'Failed subscription payment'
          }
        });

        console.log(`Payment failed for user ${user.id}: $${((invoiceData.amount_due as number) || 0) / 100}`);
      }
    }

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}
