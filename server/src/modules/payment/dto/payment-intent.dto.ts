import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsNumber()
  amountVnd: number;

  @IsOptional()
  @IsString()
  paymentMethod?: 'VIETQR' | 'MOMO';

  @IsOptional()
  @IsNumber()
  maxSlippageBps?: number;
}
