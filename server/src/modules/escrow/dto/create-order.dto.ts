import {
  IsNotEmpty,
  IsString,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsNumberString()
  orderId: string;
  orderId!: string;

  @IsNotEmpty()
  @IsString()
  buyerWallet: string;
  buyerWallet!: string;

  @IsNotEmpty()
  @IsString()
  sellerWallet: string;
  sellerWallet!: string;

  @IsNotEmpty()
  @IsNumberString()
  amount: string; // Lamports
  amount!: string; // Lamports

  @IsOptional()
  @IsNumberString()
  timeoutDuration?: string; // Seconds

  @IsOptional()
  @IsString()
  trackingCode?: string;

  @IsOptional()
  @IsString()
  txSignature?: string;
}
