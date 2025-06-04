import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
});

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: number;
  features: string[];
  limits: any;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  billingInterval: string;
  stripeProductId: string;
  stripePriceId: string;
  _count: {
    subscriptions: number;
  };
}

// Get subscription plans
export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      },
      include: {
        _count: {
          select: {
            subscriptions: true
          }
        }
      }
    });

    // Transform the response to include subscriber count but not expose internal details
    const formattedPlans = plans.map((plan: SubscriptionPlan) => ({
      ...plan,
      subscriberCount: plan._count.subscriptions,
      _count: undefined
    }));

    return NextResponse.json({ plans: formattedPlans });

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new subscription plan (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminProfile = await prisma.admin.findUnique({
      where: { userId: session.user.id }
    });

    if (!adminProfile || !adminProfile.permissions.includes('plan_management')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const planData = await request.json();

    // Create product in Stripe
    const stripeProduct = await stripe.products.create({
      name: planData.displayName,
      description: planData.description,
      metadata: {
        planId: planData.name
      }
    });

    // Create price in Stripe
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(planData.price * 100), // Convert to cents
      currency: 'usd',
      recurring: {
        interval: planData.billingInterval
      }
    });

    // Create plan in database
    const plan = await prisma.subscriptionPlan.create({
      data: {
        ...planData,
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId: adminProfile.id,
        action: 'plan_created',
        targetType: 'subscription_plan',
        targetId: plan.id,
        details: {
          planName: plan.displayName,
          price: plan.price
        }
      }
    });

    return NextResponse.json({ plan });

  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
