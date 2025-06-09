import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Initialize Stripe only if we have a real key
const isStripeConfigured = process.env.STRIPE_SECRET_KEY && 
  !process.env.STRIPE_SECRET_KEY.includes('your_') && 
  !process.env.STRIPE_SECRET_KEY.includes('placeholder');

const stripe = isStripeConfigured ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
}) : null;

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

    // Transform the response to include subscriber count and properly format pricing
    const formattedPlans = plans.map((plan) => ({
      ...plan,
      subscriberCount: plan._count.subscriptions,
      price: Number(plan.priceMonthly) / 100, // Convert from cents to dollars
      priceYearly: plan.priceYearly ? Number(plan.priceYearly) / 100 : null,
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
    // Use JWT authentication for admin endpoints
    const { verifyAdminAuth } = await import('@/lib/auth/jwt');
    const authResult = await verifyAdminAuth(request, ['plan_management']);
    
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { admin } = authResult;

    const planData = await request.json();

    let stripeProduct = null;
    let stripePrice = null;

    // Only create Stripe product/price if Stripe is configured
    if (stripe && isStripeConfigured) {
      try {
        // Create product in Stripe
        stripeProduct = await stripe.products.create({
          name: planData.displayName,
          description: planData.description,
          metadata: {
            planId: planData.name
          }
        });

        // Create price in Stripe
        stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: Math.round(planData.priceMonthly * 100), // Convert to cents
          currency: planData.currency || 'usd',
          recurring: {
            interval: planData.billingInterval || 'month'
          }
        });
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        // Continue without Stripe if there's an error
        stripeProduct = null;
        stripePrice = null;
      }
    }

    // Create plan in database
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: planData.name,
        displayName: planData.displayName,
        description: planData.description,
        priceMonthly: planData.priceMonthly * 100, // Store in cents
        priceYearly: planData.priceYearly ? planData.priceYearly * 100 : null,
        currency: planData.currency || 'USD',
        billingInterval: planData.billingInterval || 'month',
        stripeProductId: stripeProduct?.id || null,
        stripePriceId: stripePrice?.id || null,
        features: planData.features || [],
        limits: planData.limits || {},
        maxVideos: planData.maxVideos || -1,
        maxStorage: planData.maxStorage || -1,
        maxExportsPerMonth: planData.maxExportsPerMonth || -1,
        hasAiEnhancement: planData.hasAiEnhancement ?? true,
        hasScheduling: planData.hasScheduling ?? true,
        hasAnalytics: planData.hasAnalytics ?? true,
        hasTemplates: planData.hasTemplates ?? true,
        hasPrioritySupport: planData.hasPrioritySupport ?? false,
        hasWhiteLabel: planData.hasWhiteLabel ?? false,
        hasApiAccess: planData.hasApiAccess ?? false,
        isPopular: planData.isPopular ?? false,
        sortOrder: planData.sortOrder ?? 0,
        isActive: planData.isActive ?? true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId: admin!.adminId,
        action: 'plan_created',
        targetType: 'subscription_plan',
        targetId: plan.id,
        details: {
          planName: plan.displayName,
          priceMonthly: Number(plan.priceMonthly) / 100
        }
      }
    });

    return NextResponse.json({ 
      plan: {
        ...plan,
        price: Number(plan.priceMonthly) / 100, // Convert back to dollars for response
        priceYearly: plan.priceYearly ? Number(plan.priceYearly) / 100 : null
      }
    });

  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
