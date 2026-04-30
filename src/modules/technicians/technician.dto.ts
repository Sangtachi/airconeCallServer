import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';

export class TechnicianCapabilityInputDto {
  @ApiProperty({ enum: ['install', 'cleaning'] })
  @IsIn(['install', 'cleaning'])
  serviceType!: 'install' | 'cleaning';

  @ApiProperty({ enum: ['wall', 'stand', 'two_in_one', 'system'] })
  @IsIn(['wall', 'stand', 'two_in_one', 'system'])
  airconType!: 'wall' | 'stand' | 'two_in_one' | 'system';
}

export class TechnicianSignupDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ description: '숫자만 또는 하이픈 포함 — 저장 시 간단히 정규화' })
  @IsString()
  @MinLength(8)
  phone!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  baseRegion?: string;

  @ApiProperty({ type: [TechnicianCapabilityInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TechnicianCapabilityInputDto)
  capabilities!: TechnicianCapabilityInputDto[];
}

export class TechnicianSessionDto {
  @ApiProperty({ description: '승인된 기사 로그인(데모용 — OTP 없음)' })
  @IsString()
  @MinLength(8)
  phone!: string;
}

export class TechnicianOrderPhotoDto {
  @ApiProperty({ enum: ['before_work', 'after_work', 'other'] })
  @IsIn(['before_work', 'after_work', 'other'])
  kind!: 'before_work' | 'after_work' | 'other';

  @ApiProperty({ description: 'MVP: 공개 URL 문자열(S3 업로드·Presign은 후속).' })
  @IsString()
  @MinLength(4)
  url!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  caption?: string;
}
