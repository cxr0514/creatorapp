'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Star } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: number;
  billingInterval: 'month' | 'year';
  features: string[];
  limits: {
    videos: number;
    storage: number;
  };
  isPopular: boolean;
  isActive: boolean;
}

interface UserSubscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: SubscriptionPlan;
}

export default function PricingPlans() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    if (session?.user) {
      fetchUserSubscription();
    }
  }, [session]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/current');
      if (response.ok) {
        const data = await response.json();
        setUserSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!session?.user) {
      toast.error('Please sign in to subscribe to a plan.');
      return;
    }

    setCheckoutLoading(planId);
    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: `${window.location.origin}/pricing?subscription=canceled`
        })
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to start checkout');
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast.error('Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const formatPrice = (price: number, interval: string) => {
    return `$${price}/${interval}`;
  };

  const formatStorage = (gb: number) => {
    return gb >= 1000 ? `${gb / 1000}TB` : `${gb}GB`;
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'pro':
        return <Zap className="w-6 h-6 text-purple-600" />;
      case 'business':
        return <Crown className="w-6 h-6 text-yellow-600" />;
      case 'enterprise':
        return <Star className="w-6 h-6 text-blue-600" />;
      default:
        return <Check className="w-6 h-6 text-green-600" />;
    }
  };

  const isCurrentPlan = (planId: string) => {
    return userSubscription?.plan.id === planId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Unlock powerful features to create, edit, and share amazing short-form content. 
          Choose the plan that fits your needs and start creating today.
        </p>
      </div>

      {userSubscription && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Current Subscription</h3>
                <p className="text-gray-600">
                  {userSubscription.plan.displayName} - {formatPrice(userSubscription.plan.price, userSubscription.plan.billingInterval)}
                </p>
                <p className="text-sm text-gray-500">
                  {userSubscription.cancelAtPeriodEnd 
                    ? `Cancels on ${new Date(userSubscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(userSubscription.currentPeriodEnd).toLocaleDateString()}`
                  }
                </p>
              </div>
              <Badge variant={userSubscription.status === 'active' ? 'default' : 'secondary'}>
                {userSubscription.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${
              plan.isPopular 
                ? 'border-purple-500 shadow-lg scale-105' 
                : isCurrentPlan(plan.id)
                ? 'border-green-500'
                : 'border-gray-200'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white">Most Popular</Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                {getPlanIcon(plan.name)}
              </div>
              <CardTitle className="text-xl">{plan.displayName}</CardTitle>
              <div className="text-3xl font-bold">
                {formatPrice(plan.price, plan.billingInterval)}
              </div>
              <p className="text-gray-600 text-sm">{plan.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Features</h4>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Limits</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Videos: {plan.limits.videos === -1 ? 'Unlimited' : plan.limits.videos}</div>
                  <div>Storage: {formatStorage(plan.limits.storage)}</div>
                </div>
              </div>
              
              <Button
                className="w-full"
                variant={plan.isPopular ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.id)}
                disabled={checkoutLoading === plan.id || isCurrentPlan(plan.id)}
              >
                {checkoutLoading === plan.id ? (
                  'Processing...'
                ) : isCurrentPlan(plan.id) ? (
                  'Current Plan'
                ) : (
                  'Subscribe Now'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>All plans include our core features and 24/7 support.</p>
        <p>Cancel anytime. No hidden fees.</p>
      </div>
    </div>
  );
}
