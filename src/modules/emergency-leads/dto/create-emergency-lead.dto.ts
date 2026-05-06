import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

/** 공개 접수 폼 필드명을 프런트와 동일하게 수용합니다. */
export class CreateEmergencyLeadDto {
  @IsString()
  @MinLength(8)
  @MaxLength(120)
  clientSessionId!: string;

  /** 기본 40, 허용 5~120 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(120)
  matchingTimeoutSeconds?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  location!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  acType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  issue?: string;

  @IsOptional()
  @IsIn(['now', 'scheduled'])
  urgency?: 'now' | 'scheduled';

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  customerName?: string;
}
