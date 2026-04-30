import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuoteItemLineDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @ApiProperty({ required: false, default: 'each' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ description: '원 단위' })
  @IsInt()
  @Min(0)
  unitPrice!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  addonId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  materialId?: string;
}

export class TechnicianCreateQuoteDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  memo?: string;

  @ApiProperty({ type: [QuoteItemLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemLineDto)
  items!: QuoteItemLineDto[];
}

export class MockPayExtraQuoteDto {
  /** 메모 검증 등에 활용 가능 */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
