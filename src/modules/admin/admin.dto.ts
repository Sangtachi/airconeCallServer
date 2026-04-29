import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { BookingStatus } from './admin.types';

export class AssignTechnicianDto {
  @ApiProperty()
  @IsString()
  technicianId!: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty()
  @IsIn([
    'created',
    'payment_pending',
    'paid',
    'matching',
    'assigned',
    'accepted',
    'on_the_way',
    'arrived',
    'diagnosed',
    'extra_payment_pending',
    'working',
    'completed',
    'cancelled',
    'refunded',
    'settlement_pending',
    'settled',
  ])
  toStatus!: BookingStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateTechnicianDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  phone!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  baseRegion?: string;
}

export class CreateMemberDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  phone!: string;
}

export class UpdateMemberDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, enum: ['active', 'inactive', 'banned'] })
  @IsOptional()
  @IsIn(['active', 'inactive', 'banned'])
  status?: 'active' | 'inactive' | 'banned';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  memo?: string;
}

export class CreateBookingDto {
  @ApiProperty()
  @IsString()
  customerName!: string;

  @ApiProperty()
  @IsString()
  customerPhone!: string;

  @ApiProperty()
  @IsString()
  region!: string;

  @ApiProperty()
  @IsString()
  symptomCode!: string;
}

export class UpdateTechnicianDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  baseRegion?: string;

  @ApiProperty({ required: false, enum: ['pending', 'approved', 'rejected', 'suspended'] })
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'suspended'])
  status?: 'pending' | 'approved' | 'rejected' | 'suspended';
}

export class CancelPaymentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ConfirmSettlementDto {
  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  adjustmentAmount?: number;
}

export class UpdateSettlementStatusDto {
  @ApiProperty({ enum: ['pending', 'confirmed', 'paid', 'held', 'cancelled'] })
  @IsIn(['pending', 'confirmed', 'paid', 'held', 'cancelled'])
  status!: 'pending' | 'confirmed' | 'paid' | 'held' | 'cancelled';
}

export class CreateCouponDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty({ enum: ['signup', 'aircon_register', 'referral', 'manual'] })
  @IsIn(['signup', 'aircon_register', 'referral', 'manual'])
  couponType!: 'signup' | 'aircon_register' | 'referral' | 'manual';

  @ApiProperty()
  @IsInt()
  @Min(1000)
  amount!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class UpdateCouponDto {
  @ApiProperty({ required: false, enum: ['active', 'used', 'expired', 'cancelled'] })
  @IsOptional()
  @IsIn(['active', 'used', 'expired', 'cancelled'])
  status?: 'active' | 'used' | 'expired' | 'cancelled';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class ReviewOnboardingDto {
  @ApiProperty({ enum: ['reviewing', 'approved', 'rejected'] })
  @IsIn(['reviewing', 'approved', 'rejected'])
  status!: 'reviewing' | 'approved' | 'rejected';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rejectReason?: string;
}
