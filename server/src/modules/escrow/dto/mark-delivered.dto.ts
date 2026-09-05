import { IsOptional, IsString } from 'class-validator';

export class MarkDeliveredDto {
  @IsOptional()
  @IsString()
  authorityWallet?: string;

  @IsOptional()
  @IsString()
  txSignature?: string;
}
