import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOrderDraftDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty({ enum: ['same_day', 'reservation'] })
  @IsIn(['same_day', 'reservation'])
  scheduleType!: 'same_day' | 'reservation';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  customerName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  customerPhone!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  addressSummary!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerMemo?: string;
}
