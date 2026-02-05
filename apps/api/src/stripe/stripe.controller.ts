import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Headers,
  HttpCode,
  RawBodyRequest,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StripeService } from './stripe.service';
import { CreateCheckoutSessionDto, CreatePortalSessionDto } from './dto/stripe.dto';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    companyId: string | null;
  };
}

@Controller('stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(private readonly stripeService: StripeService) {}

  /**
   * Get Stripe configuration (public endpoint)
   */
  @Get('config')
  getConfig() {
    return {
      priceId: this.stripeService.getPriceId(),
    };
  }

  private validateCompanyId(companyId: string | null): string {
    if (!companyId) {
      throw new BadRequestException('Kein Unternehmen zugeordnet. Billing ist nur für Firmenkonten verfügbar.');
    }
    return companyId;
  }

  /**
   * Create a checkout session for subscription
   */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(
    @Request() req: RequestWithUser,
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<{ url: string }> {
    const companyId = this.validateCompanyId(req.user.companyId);
    return this.stripeService.createCheckoutSession(
      companyId,
      dto.priceId,
      dto.successUrl,
      dto.cancelUrl,
    );
  }

  /**
   * Create a customer portal session for managing subscription
   */
  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async createPortalSession(
    @Request() req: RequestWithUser,
    @Body() dto: CreatePortalSessionDto,
  ): Promise<{ url: string }> {
    const companyId = this.validateCompanyId(req.user.companyId);
    return this.stripeService.createPortalSession(
      companyId,
      dto.returnUrl,
    );
  }

  /**
   * Get current subscription details
   */
  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@Request() req: RequestWithUser) {
    const companyId = this.validateCompanyId(req.user.companyId);
    return this.stripeService.getSubscription(companyId);
  }

  /**
   * Handle Stripe webhook events
   * This endpoint is NOT protected by JWT - it uses Stripe signature verification
   */
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Request() req: RawBodyRequest<ExpressRequest>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    try {
      await this.stripeService.handleWebhookEvent(req.rawBody!, signature);
      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }
}
