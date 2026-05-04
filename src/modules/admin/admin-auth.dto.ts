import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    required: false,
    enum: ['admin', 'dispatch_admin', 'ops_admin', 'finance_admin', 'super_admin'],
    description: 'JWT role 클레임. 미지정 시 username으로 추론하고 최종 기본값은 admin.',
  })
  @IsOptional()
  @IsString()
  role?: 'admin' | 'dispatch_admin' | 'ops_admin' | 'finance_admin' | 'super_admin';

  @ApiProperty({ description: '.env ADMIN_BOOTSTRAP_PASSWORD 와 비교(dev 전용 가능)' })
  @IsString()
  @MinLength(1)
  password!: string;
}
