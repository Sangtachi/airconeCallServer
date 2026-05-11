import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterNotificationDeviceDto {
  @ApiProperty({ enum: ['fcm', 'web_push'] })
  @IsIn(['fcm', 'web_push'])
  channel!: 'fcm' | 'web_push';

  @ApiProperty({ required: false, description: 'FCM registration token 또는 Web Push endpoint' })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  token?: string;

  @ApiProperty({ required: false, description: 'PushSubscription JSON' })
  @IsOptional()
  @IsObject()
  subscription?: Record<string, unknown>;

  @ApiProperty({ required: false, enum: ['web', 'android', 'ios', 'unknown'] })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  platform?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceLabel?: string;
}
