import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class MockConfirmPaymentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  orderId!: string;
}
