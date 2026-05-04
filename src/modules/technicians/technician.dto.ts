import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class TechnicianCapabilityInputDto {
  @ApiProperty({ enum: ['install', 'cleaning'] })
  @IsIn(['install', 'cleaning'])
  serviceType!: 'install' | 'cleaning';

  @ApiProperty({ enum: ['wall', 'stand', 'two_in_one', 'system'] })
  @IsIn(['wall', 'stand', 'two_in_one', 'system'])
  airconType!: 'wall' | 'stand' | 'two_in_one' | 'system';
}

export class TechnicianDocumentInputDto {
  @ApiProperty({ enum: ['id_card', 'business_license', 'career', 'insurance', 'bankbook', 'other'] })
  @IsIn(['id_card', 'business_license', 'career', 'insurance', 'bankbook', 'other'])
  documentType!: 'id_card' | 'business_license' | 'career' | 'insurance' | 'bankbook' | 'other';

  @ApiProperty({ description: '임시 MVP: Storage 업로드 후 URL 또는 외부 파일 URL' })
  @IsString()
  @MinLength(4)
  fileUrl!: string;
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

  @ApiProperty({ description: '임시 자체 인증용 비밀번호. 추후 SMS/Supabase Auth로 교체' })
  @IsString()
  @MinLength(5)
  password!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  baseRegion?: string;

  @ApiProperty({ required: false, enum: ['individual', 'sole_business', 'company'] })
  @IsOptional()
  @IsIn(['individual', 'sole_business', 'company'])
  businessType?: 'individual' | 'sole_business' | 'company';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  businessNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankHolder?: string;

  @ApiProperty({ required: false, type: [String], description: '활동 가능 지역 목록' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  availableSameDay?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  availableReservation?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  availableWeekend?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  availableNight?: boolean;

  @ApiProperty({ type: [TechnicianCapabilityInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TechnicianCapabilityInputDto)
  capabilities!: TechnicianCapabilityInputDto[];

  @ApiProperty({ required: false, type: [TechnicianDocumentInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TechnicianDocumentInputDto)
  documents?: TechnicianDocumentInputDto[];
}

export class TechnicianSessionDto {
  @ApiProperty({ description: '승인된 기사 로그인 전화번호' })
  @IsString()
  @MinLength(8)
  phone!: string;

  @ApiProperty({ description: '비밀번호' })
  @IsString()
  @MinLength(5)
  password!: string;
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
