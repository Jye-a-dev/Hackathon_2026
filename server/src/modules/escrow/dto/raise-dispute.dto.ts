import { IsOptional, IsString, IsArray } from 'class-validator';

export class RaiseDisputeDto {
  @IsOptional()
  @IsString()
  buyerWallet?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  evidenceUrl?: string;

  @IsOptional()
  @IsArray()
  evidenceUrls?: string[];

  @IsOptional()
  @IsString()
  txSignature?: string;
}
