import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { CatalogAirconType, CatalogServiceType } from './service-catalog.types';

export class PatchServiceProductDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  basePrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sameDayExtraPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sameDayPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  includedPipeMeter?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  includedRefrigerantCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  includedHoleCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateServiceProductDto {
  @ApiProperty()
  @IsString()
  categoryId!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty({ enum: ['install', 'cleaning'] })
  @IsIn(['install', 'cleaning'])
  serviceType!: CatalogServiceType;

  @ApiProperty({ enum: ['wall', 'stand', 'two_in_one', 'system'] })
  @IsIn(['wall', 'stand', 'two_in_one', 'system'])
  airconType!: CatalogAirconType;

  @ApiProperty()
  @IsInt()
  @Min(0)
  basePrice!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sameDayExtraPrice!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sameDayPrice!: number;

  @ApiProperty({ required: false, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  includedPipeMeter?: number;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  includedRefrigerantCount?: number;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  includedHoleCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class PatchServiceAddonDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  customerPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  technicianCostAllowance?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  platformFeeRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateServiceAddonDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty({ required: false, default: 'each' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  customerPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
