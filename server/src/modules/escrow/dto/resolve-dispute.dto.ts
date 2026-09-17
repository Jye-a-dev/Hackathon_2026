import { IsNotEmpty, IsIn, IsOptional, IsString } from 'class-validator';

export class ResolveDisputeDto {
  @IsNotEmpty()
  @IsIn(['ReleaseToSeller', 'RefundToBuyer'])
  decision!: 'ReleaseToSeller' | 'RefundToBuyer';

  @IsOptional()
  @IsString()
  notes?: string;
}
