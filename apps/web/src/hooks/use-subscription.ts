'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stripeApi, SubscriptionResponse } from '@/lib/api/stripe';
import { toast } from 'sonner';

// Query Keys
export const subscriptionKeys = {
  all: ['subscription'] as const,
  current: () => [...subscriptionKeys.all, 'current'] as const,
};

export const stripeConfigKeys = {
  config: ['stripe', 'config'] as const,
};

/**
 * Hook to get Stripe configuration (price ID)
 */
export function useStripeConfig() {
  return useQuery({
    queryKey: stripeConfigKeys.config,
    queryFn: stripeApi.getConfig,
    staleTime: Infinity, // Config doesn't change during session
  });
}

/**
 * Hook to get current subscription details
 */
export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.current(),
    queryFn: stripeApi.getSubscription,
    staleTime: 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on 400 errors (e.g., Stripe not configured)
      if ((error as { response?: { status?: number } })?.response?.status === 400) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook to create a checkout session and redirect to Stripe
 */
export function useCreateCheckout() {
  return useMutation({
    mutationFn: (priceId: string) => stripeApi.createCheckoutSession(priceId),
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: () => {
      toast.error('Fehler beim Starten des Checkouts. Bitte versuchen Sie es erneut.');
    },
  });
}

/**
 * Hook to create a portal session and redirect to Stripe
 */
export function useCreatePortal() {
  return useMutation({
    mutationFn: stripeApi.createPortalSession,
    onSuccess: (data) => {
      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    },
    onError: () => {
      toast.error('Fehler beim Oeffnen des Kundenportals. Bitte versuchen Sie es erneut.');
    },
  });
}

/**
 * Hook to invalidate subscription data (e.g., after returning from Stripe)
 */
export function useRefreshSubscription() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
  };
}
