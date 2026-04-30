import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class PatchEmergencyLeadContactDto {
  @IsString()
  @MinLength(8)
  @MaxLength(120)
  clientSessionId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  customerName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  userId?: string | null;
}
