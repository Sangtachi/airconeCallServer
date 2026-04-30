import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class TechnicianPhotoPresignDto {
  @ApiProperty({
    enum: ['image/jpeg', 'image/png', 'image/webp'],
    description: 'Signed PUT 업로드 시 Content-Type 과 동일해야 합니다.',
    default: 'image/jpeg',
  })
  @IsOptional()
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])
  mimeType?: string;

  @ApiProperty({ required: false, description: '로그 추적용(미사용). presign 경로는 UUID 로 고정입니다.' })
  @IsOptional()
  @IsString()
  filename?: string;
}

export class TechnicianPhotoConfirmDto {
  @ApiProperty({
    description: 'Supabase Storage 내 전체 객체 경로 (presign 응답과 동일). 예: orders/{orderId}/uuid.jpg',
  })
  @IsString()
  @MinLength(3)
  path!: string;

  @ApiProperty({ enum: ['before_work', 'after_work', 'other'] })
  @IsIn(['before_work', 'after_work', 'other'])
  kind!: 'before_work' | 'after_work' | 'other';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  caption?: string;
}

export class TechnicianPhotoMultipartMetaDto {
  @ApiProperty({ enum: ['before_work', 'after_work', 'other'] })
  @IsIn(['before_work', 'after_work', 'other'])
  kind!: 'before_work' | 'after_work' | 'other';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  caption?: string;
}
