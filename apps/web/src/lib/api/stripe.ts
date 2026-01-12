import { apiClient } from './client';

export interface SubscriptionResponse {
  status: string | null;
  subscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  priceId: string | null;
  productName: string | null;
}

export interface CheckoutResponse {
  url: string;
}

export interface PortalResponse {
  url: string;
}

export interface StripeConfigResponse {
  priceId: string;
}

export const stripeApi = {
  /**
   * Get Stripe configuration (price ID)
   */
  getConfig: async (): Promise<StripeConfigResponse> => {
    const response = await apiClient.get<StripeConfigResponse>('/stripe/config');
    return response.data;
  },

  /**
   * Get current subscription details
   */
  getSubscription: async (): Promise<SubscriptionResponse> => {
    const response = await apiClient.get<SubscriptionResponse>('/stripe/subscription');
    return response.data;
  },

  /**
   * Create a checkout session to start a subscription
   */
  createCheckoutSession: async (priceId: string): Promise<CheckoutResponse> => {
    const response = await apiClient.post<CheckoutResponse>('/stripe/checkout', {
      priceId,
    });
    return response.data;
  },

  /**
   * Create a customer portal session for managing subscription
   */
  createPortalSession: async (): Promise<PortalResponse> => {
    const response = await apiClient.post<PortalResponse>('/stripe/portal', {});
    return response.data;
  },
};
