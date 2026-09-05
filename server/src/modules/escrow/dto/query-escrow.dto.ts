import { IsOptional, IsString, IsIn } from 'class-validator';

export class QueryEscrowDto {
  @IsOptional()
  @IsString()
  buyerWallet?: string;

  @IsOptional()
  @IsString()
  sellerWallet?: string;

  @IsOptional()
  @IsIn(['LOCKED', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'REFUNDED'])
  status?: string;

  @IsOptional()
  limit?: number;

  @IsOptional()
  offset?: number;
}
