import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ShippingWebhookDto {
  @IsOptional()
  @IsString()
  trackingCode?: string;

  @IsOptional()
  orderId?: string | number;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  partner?: string;

  @IsOptional()
  @IsString()
  deliveredAt?: string;

  @IsOptional()
  @IsString()
  rawPayload?: string;
}
