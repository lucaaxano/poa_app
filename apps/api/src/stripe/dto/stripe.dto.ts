import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  priceId: string;

  @IsOptional()
  @IsUrl()
  successUrl?: string;

  @IsOptional()
  @IsUrl()
  cancelUrl?: string;
}

export class CreatePortalSessionDto {
  @IsOptional()
  @IsUrl()
  returnUrl?: string;
}
