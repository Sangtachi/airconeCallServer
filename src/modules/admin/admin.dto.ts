import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';
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

  @ApiProperty({ required: false, description: '관리자 생성 시 기사 초기 비밀번호' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  password?: string;

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

  @ApiProperty({ required: false, description: '관리자 생성 시 초기 비밀번호' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  password?: string;

  @ApiProperty({ required: false, enum: ['customer', 'admin', 'super_admin'] })
  @IsOptional()
  @IsIn(['customer', 'admin', 'super_admin'])
  role?: 'customer' | 'admin' | 'super_admin';
}

export class RegisterMemberDto {
  @ApiProperty({ description: '전화번호. 숫자/하이픈 모두 허용' })
  @IsString()
  phone!: string;

  @ApiProperty({ description: '임시 자체 인증용 비밀번호. 추후 SMS/Supabase Auth로 교체' })
  @IsString()
  @MinLength(5)
  password!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;

  @ApiProperty({ required: false, description: '긴급 리드 또는 주문 참조값' })
  @IsOptional()
  @IsString()
  bookingRef?: string;
}

export class MemberSessionDto {
  @ApiProperty({ description: '전화번호. 숫자/하이픈 모두 허용' })
  @IsString()
  phone!: string;

  @ApiProperty({ description: '비밀번호' })
  @IsString()
  @MinLength(5)
  password!: string;
}

export class CreateMemberAddressDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  address!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  detailAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sido?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sigungu?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dong?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateMemberAddressDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  detailAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sido?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sigungu?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dong?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateAirconAssetDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @ApiProperty({ enum: ['wall', 'stand', 'two_in_one', 'system', 'unknown'] })
  @IsIn(['wall', 'stand', 'two_in_one', 'system', 'unknown'])
  type!: 'wall' | 'stand' | 'two_in_one' | 'system' | 'unknown';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  modelName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1990)
  installedYear?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  memo?: string;
}

export class UpdateAirconAssetDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @ApiProperty({ required: false, enum: ['wall', 'stand', 'two_in_one', 'system', 'unknown'] })
  @IsOptional()
  @IsIn(['wall', 'stand', 'two_in_one', 'system', 'unknown'])
  type?: 'wall' | 'stand' | 'two_in_one' | 'system' | 'unknown';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  modelName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1990)
  installedYear?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  memo?: string;
}

export class UseCouponDto {
  @ApiProperty({ required: false, description: '쿠폰을 특정 주문에 사용할 때 전달' })
  @IsOptional()
  @IsUUID()
  orderId?: string;
}

export class CreateOrderReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RegisterSellerDto {
  @ApiProperty()
  @IsString()
  ownerName!: string;

  @ApiProperty({ description: '전화번호. 숫자/하이픈 모두 허용' })
  @IsString()
  phone!: string;

  @ApiProperty({ description: '임시 자체 인증용 비밀번호. 추후 SMS/Supabase Auth로 교체' })
  @IsString()
  @MinLength(5)
  password!: string;

  @ApiProperty()
  @IsString()
  companyName!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  businessNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productCategory?: string;
}

export class CreateSellerDto {
  @ApiProperty()
  @IsString()
  ownerName!: string;

  @ApiProperty({ description: '전화번호. 숫자/하이픈 모두 허용' })
  @IsString()
  phone!: string;

  @ApiProperty({ description: '초기 비밀번호' })
  @IsString()
  @MinLength(5)
  password!: string;

  @ApiProperty()
  @IsString()
  companyName!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  businessNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productCategory?: string;

  @ApiProperty({ required: false, enum: ['pending', 'reviewing', 'approved', 'rejected', 'suspended'] })
  @IsOptional()
  @IsIn(['pending', 'reviewing', 'approved', 'rejected', 'suspended'])
  status?: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'suspended';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  memo?: string;
}

export class UpdateMemberDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, enum: ['active', 'inactive', 'banned'] })
  @IsOptional()
  @IsIn(['active', 'inactive', 'banned'])
  status?: 'active' | 'inactive' | 'banned';

  @ApiProperty({ required: false, enum: ['customer', 'admin', 'super_admin'] })
  @IsOptional()
  @IsIn(['customer', 'admin', 'super_admin'])
  role?: 'customer' | 'admin' | 'super_admin';

  @ApiProperty({ required: false, description: '비워두면 변경하지 않음' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  memo?: string;
}

export class UpdateSellerDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, description: '비워두면 변경하지 않음' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  businessNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productCategory?: string;

  @ApiProperty({ required: false, enum: ['pending', 'reviewing', 'approved', 'rejected', 'suspended'] })
  @IsOptional()
  @IsIn(['pending', 'reviewing', 'approved', 'rejected', 'suspended'])
  status?: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'suspended';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  memo?: string;
}

export class CreateMaterialDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
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
  supplierName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  oemAvailable?: boolean;
}

export class UpdateMaterialDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
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
  supplierName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  oemAvailable?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
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

export class UpdateBookingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  symptomCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  adminMemo?: string;
}

export class UpdateTechnicianDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, description: '비워두면 변경하지 않음' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  baseRegion?: string;

  @ApiProperty({ required: false, enum: ['pending', 'reviewing', 'approved', 'rejected', 'suspended'] })
  @IsOptional()
  @IsIn(['pending', 'reviewing', 'approved', 'rejected', 'suspended'])
  status?: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'suspended';

  @ApiProperty({ required: false, enum: ['unsubmitted', 'pending', 'verified', 'rejected'] })
  @IsOptional()
  @IsIn(['unsubmitted', 'pending', 'verified', 'rejected'])
  bankVerificationStatus?: 'unsubmitted' | 'pending' | 'verified' | 'rejected';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankRejectReason?: string;
}

export class UpdateOnboardingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;
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

export class CreateAdminInviteDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ enum: ['dispatch_admin', 'ops_admin', 'finance_admin', 'super_admin'] })
  @IsIn(['dispatch_admin', 'ops_admin', 'finance_admin', 'super_admin'])
  role!: 'dispatch_admin' | 'ops_admin' | 'finance_admin' | 'super_admin';
}
