import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe | null;
  private readonly frontendUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured - Stripe features will be disabled');
      this.stripe = null;
    } else {
      this.stripe = new Stripe(secretKey);
    }

    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  /**
   * Check if Stripe is properly configured
   */
  isConfigured(): boolean {
    return this.stripe !== null;
  }

  /**
   * Get the configured Stripe Price ID
   */
  getPriceId(): string {
    return this.configService.get<string>('STRIPE_PRICE_ID', '');
  }

  /**
   * Create a Stripe customer for a company
   */
  async createCustomer(companyId: string, email: string, companyName: string): Promise<string> {
    if (!this.isConfigured()) {
      this.logger.warn('Stripe not configured, skipping customer creation');
      return '';
    }

    try {
      const customer = await this.stripe!.customers.create({
        email,
        name: companyName,
        metadata: {
          companyId,
        },
      });

      // Update company with Stripe customer ID
      await this.prisma.company.update({
        where: { id: companyId },
        data: { stripeCustomerId: customer.id },
      });

      this.logger.log(`Created Stripe customer ${customer.id} for company ${companyId}`);
      return customer.id;
    } catch (error) {
      this.logger.error(`Failed to create Stripe customer: ${error.message}`);
      throw new BadRequestException('Fehler beim Erstellen des Stripe-Kunden');
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    companyId: string,
    priceId: string,
    successUrl?: string,
    cancelUrl?: string,
  ): Promise<{ url: string }> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Stripe ist nicht konfiguriert');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Firma nicht gefunden');
    }

    // Create customer if not exists
    let customerId = company.stripeCustomerId;
    if (!customerId) {
      const admin = await this.prisma.user.findFirst({
        where: { companyId, role: 'COMPANY_ADMIN' },
      });
      customerId = await this.createCustomer(companyId, admin?.email || '', company.name);
    }

    if (!customerId) {
      throw new BadRequestException('Konnte Stripe-Kunde nicht erstellen');
    }

    // Count active vehicles for dynamic quantity
    const vehicleCount = await this.prisma.vehicle.count({
      where: { companyId, isActive: true },
    });
    // Minimum 10 vehicles (= 49 EUR minimum at 4.99 EUR per vehicle)
    const quantity = Math.max(vehicleCount, 10);

    try {
      const session = await this.stripe!.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: quantity,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${this.frontendUrl}/settings/billing?success=true`,
        cancel_url: cancelUrl || `${this.frontendUrl}/settings/billing?canceled=true`,
        metadata: {
          companyId,
        },
      });

      this.logger.log(`Created checkout session ${session.id} for company ${companyId}`);

      return { url: session.url! };
    } catch (error) {
      this.logger.error(`Failed to create checkout session: ${error.message}`);
      throw new BadRequestException('Fehler beim Erstellen der Checkout-Session');
    }
  }

  /**
   * Create a customer portal session for managing subscription
   */
  async createPortalSession(companyId: string, returnUrl?: string): Promise<{ url: string }> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Stripe ist nicht konfiguriert');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company?.stripeCustomerId) {
      throw new BadRequestException('Kein Stripe-Kunde vorhanden. Bitte zuerst ein Abo abschliessen.');
    }

    try {
      const session = await this.stripe!.billingPortal.sessions.create({
        customer: company.stripeCustomerId,
        return_url: returnUrl || `${this.frontendUrl}/settings/billing`,
      });

      this.logger.log(`Created portal session for company ${companyId}`);

      return { url: session.url };
    } catch (error) {
      this.logger.error(`Failed to create portal session: ${error.message}`);
      throw new BadRequestException('Fehler beim Oeffnen des Kundenportals');
    }
  }

  /**
   * Get subscription details for a company
   */
  async getSubscription(companyId: string): Promise<{
    status: string | null;
    subscriptionId: string | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    priceId: string | null;
    productName: string | null;
  }> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Firma nicht gefunden');
    }

    // Return basic info if no Stripe configured or no subscription
    if (!this.isConfigured() || !company.subscriptionId) {
      return {
        status: company.subscriptionStatus,
        subscriptionId: company.subscriptionId,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        priceId: null,
        productName: null,
      };
    }

    try {
      const response = await this.stripe!.subscriptions.retrieve(company.subscriptionId, {
        expand: ['items.data.price.product'],
      });
      // Use any type to handle different Stripe SDK versions
      const subscription = response as unknown as {
        id: string;
        status: string;
        current_period_end?: number;
        currentPeriodEnd?: number;
        cancel_at_period_end: boolean;
        items: { data: Array<{ price?: { id: string; product?: { name: string } } }> };
      };

      const priceItem = subscription.items.data[0];
      const product = priceItem?.price?.product;
      const periodEnd = subscription.current_period_end || subscription.currentPeriodEnd;

      return {
        status: subscription.status,
        subscriptionId: subscription.id,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        priceId: priceItem?.price?.id || null,
        productName: product?.name || null,
      };
    } catch (error) {
      this.logger.error(`Failed to get subscription: ${error.message}`);
      return {
        status: company.subscriptionStatus,
        subscriptionId: company.subscriptionId,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        priceId: null,
        productName: null,
      };
    }
  }

  /**
   * Update company subscription status (called from webhook)
   */
  async updateSubscriptionStatus(
    subscriptionId: string,
    status: string,
    customerId: string,
  ): Promise<void> {
    const company = await this.prisma.company.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!company) {
      this.logger.warn(`No company found for Stripe customer ${customerId}`);
      return;
    }

    await this.prisma.company.update({
      where: { id: company.id },
      data: {
        subscriptionId,
        subscriptionStatus: status,
      },
    });

    this.logger.log(`Updated subscription status for company ${company.id}: ${status}`);
  }

  /**
   * Handle subscription deletion
   */
  async handleSubscriptionDeleted(subscriptionId: string): Promise<void> {
    const company = await this.prisma.company.findFirst({
      where: { subscriptionId },
    });

    if (!company) {
      this.logger.warn(`No company found for subscription ${subscriptionId}`);
      return;
    }

    await this.prisma.company.update({
      where: { id: company.id },
      data: {
        subscriptionStatus: 'canceled',
      },
    });

    this.logger.log(`Subscription canceled for company ${company.id}`);
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(rawBody: Buffer, signature: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Stripe ist nicht konfiguriert');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET nicht konfiguriert');
    }

    // Verify and construct the event
    const event = this.stripe!.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as { subscription?: string; customer?: string };
        if (session.subscription && session.customer) {
          // Retrieve subscription to get its status
          const subscription = await this.stripe!.subscriptions.retrieve(
            session.subscription as string,
          );
          await this.updateSubscriptionStatus(
            subscription.id,
            subscription.status,
            session.customer as string,
          );
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as { subscription?: string; customer?: string };
        if (invoice.subscription && invoice.customer) {
          await this.updateSubscriptionStatus(
            invoice.subscription as string,
            'active',
            invoice.customer as string,
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as { subscription?: string; customer?: string };
        if (invoice.subscription && invoice.customer) {
          await this.updateSubscriptionStatus(
            invoice.subscription as string,
            'past_due',
            invoice.customer as string,
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as { id: string; status: string; customer: string };
        await this.updateSubscriptionStatus(
          subscription.id,
          subscription.status,
          subscription.customer as string,
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as { id: string };
        await this.handleSubscriptionDeleted(subscription.id);
        break;
      }

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }
}
