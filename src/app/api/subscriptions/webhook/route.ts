import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
});

// Stripe webhook handler
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    console.error('Webhook signature verification failed:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Get the subscription from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
  
  // Get plan details
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId }
  });

  if (!plan) {
    console.error('Plan not found:', planId);
    return;
  }

  // Create subscription record
  await prisma.subscription.create({
    data: {
      userId,
      planId,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: stripeSubscription.customer as string,
      status: stripeSubscription.status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cancelAtPeriodEnd: (stripeSubscription as any).cancel_at_period_end
    }
  });

  // Create payment history record
  await prisma.paymentHistory.create({
    data: {
      userId,
      stripePaymentIntentId: session.payment_intent as string,
      amount: Number(plan.priceMonthly),
      currency: 'usd',
      status: 'succeeded',
      description: `Subscription to ${plan.displayName}`
    }
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Create payment history record
  await prisma.paymentHistory.create({
    data: {
      userId: user.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stripePaymentIntentId: (invoice as any).payment_intent || invoice.id,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
      status: 'succeeded',
      description: invoice.description || 'Subscription payment'
    }
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  });

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update subscription status if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((invoice as any).subscription) {
    await prisma.subscription.updateMany({
      where: {
        userId: user.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stripeSubscriptionId: (invoice as any).subscription as string
      },
      data: {
        status: 'past_due'
      }
    });
  }

  // Create payment history record
  await prisma.paymentHistory.create({
    data: {
      userId: user.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stripePaymentIntentId: (invoice as any).payment_intent || invoice.id,
      amount: invoice.amount_due / 100, // Convert from cents
      currency: invoice.currency,
      status: 'failed',
      description: invoice.description || 'Subscription payment failed'
    }
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id
    },
    data: {
      status: subscription.status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end
    }
  });
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id
    },
    data: {
      status: 'canceled',
      cancelledAt: new Date()
    }
  });
}
