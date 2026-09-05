import { IsArray, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class DisputeEvidenceDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  evidenceUrls: string[];

  @IsOptional()
  @IsString()
  reason?: string;
}

