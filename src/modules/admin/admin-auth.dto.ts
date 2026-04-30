import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: '.env ADMIN_BOOTSTRAP_PASSWORD 와 비교(dev 전용 가능)' })
  @IsString()
  @MinLength(1)
  password!: string;
}
