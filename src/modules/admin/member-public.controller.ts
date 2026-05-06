import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateAirconAssetDto,
  CreateMaterialDto,
  CreateMemberAddressDto,
  CreateOrderReviewDto,
  MemberSessionDto,
  RegisterMemberDto,
  RegisterSellerDto,
  UpdateAirconAssetDto,
  UpdateMaterialDto,
  UpdateMemberAddressDto,
  UseCouponDto,
} from './admin.dto';
import { AdminService } from './admin.service';

@ApiTags('auth-public')
@Controller('auth')
export class AuthPublicController {
  constructor(private readonly admin: AdminService) {}

  @Post('session')
  @ApiOperation({ summary: '전화번호/비밀번호 통합 로그인: DB role 기준 대시보드 분기' })
  session(@Body() dto: MemberSessionDto) {
    return this.admin.unifiedSession(dto);
  }
}

@ApiTags('members-public')
@Controller('members')
export class MemberPublicController {
  constructor(private readonly admin: AdminService) {}

  @Post('register')
  @ApiOperation({ summary: '고객 회원 upsert + 가입 쿠폰 멱등 발급(Supabase)' })
  register(@Body() dto: RegisterMemberDto) {
    return this.admin.registerMember(dto);
  }

  @Post('session')
  @ApiOperation({ summary: 'members 테이블 전화번호 기반 임시 로그인(Supabase)' })
  session(@Body() dto: MemberSessionDto) {
    return this.admin.memberSession(dto);
  }

  @Get(':id/dashboard')
  @ApiOperation({ summary: '고객 대시보드: 회원 정보, 쿠폰, 문의 목록(Supabase)' })
  dashboard(@Param('id') id: string) {
    return this.admin.memberDashboard(id);
  }

  @Post(':id/addresses')
  @ApiOperation({ summary: '고객 주소 등록(Supabase)' })
  createAddress(@Param('id') id: string, @Body() dto: CreateMemberAddressDto) {
    return this.admin.createMemberAddress(id, dto);
  }

  @Patch(':id/addresses/:addressId')
  @ApiOperation({ summary: '고객 주소 수정(Supabase)' })
  updateAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateMemberAddressDto,
  ) {
    return this.admin.updateMemberAddress(id, addressId, dto);
  }

  @Delete(':id/addresses/:addressId')
  @ApiOperation({ summary: '고객 주소 삭제(Supabase)' })
  deleteAddress(@Param('id') id: string, @Param('addressId') addressId: string) {
    return this.admin.deleteMemberAddress(id, addressId);
  }

  @Post(':id/assets')
  @ApiOperation({ summary: '고객 에어컨 자산 등록(Supabase)' })
  createAsset(@Param('id') id: string, @Body() dto: CreateAirconAssetDto) {
    return this.admin.createAirconAsset(id, dto);
  }

  @Patch(':id/assets/:assetId')
  @ApiOperation({ summary: '고객 에어컨 자산 수정(Supabase)' })
  updateAsset(
    @Param('id') id: string,
    @Param('assetId') assetId: string,
    @Body() dto: UpdateAirconAssetDto,
  ) {
    return this.admin.updateAirconAsset(id, assetId, dto);
  }

  @Delete(':id/assets/:assetId')
  @ApiOperation({ summary: '고객 에어컨 자산 삭제(Supabase)' })
  deleteAsset(@Param('id') id: string, @Param('assetId') assetId: string) {
    return this.admin.deleteAirconAsset(id, assetId);
  }

  @Post(':id/coupons/:couponId/use')
  @ApiOperation({ summary: '고객 쿠폰 사용 처리 + 리워드 로그(Supabase)' })
  useCoupon(@Param('id') id: string, @Param('couponId') couponId: string, @Body() dto: UseCouponDto) {
    return this.admin.useMemberCoupon(id, couponId, dto);
  }

  @Post(':id/orders/:orderId/review')
  @ApiOperation({ summary: '고객 주문 리뷰 등록/수정(Supabase)' })
  reviewOrder(
    @Param('id') id: string,
    @Param('orderId') orderId: string,
    @Body() dto: CreateOrderReviewDto,
  ) {
    return this.admin.reviewMemberOrder(id, orderId, dto);
  }
}

@ApiTags('sellers-public')
@Controller('sellers')
export class SellerPublicController {
  constructor(private readonly admin: AdminService) {}

  @Post('register')
  @ApiOperation({ summary: '판매자 신청 upsert(Supabase)' })
  register(@Body() dto: RegisterSellerDto) {
    return this.admin.registerSeller(dto);
  }

  @Post('session')
  @ApiOperation({ summary: '판매자 전화번호 기반 임시 로그인(Supabase)' })
  session(@Body() dto: MemberSessionDto) {
    return this.admin.sellerSession(dto);
  }

  @Get(':id/dashboard')
  @ApiOperation({ summary: '판매자 대시보드: 판매자 신청/검토 상태(Supabase)' })
  dashboard(@Param('id') id: string) {
    return this.admin.sellerDashboard(id);
  }

  @Get(':id/materials')
  @ApiOperation({ summary: '판매자 자재/공급가 목록(Supabase materials)' })
  materials(@Param('id') id: string) {
    return this.admin.sellerMaterials(id);
  }

  @Post(':id/materials')
  @ApiOperation({ summary: '판매자 자재/공급가 등록(Supabase materials)' })
  createMaterial(@Param('id') id: string, @Body() dto: CreateMaterialDto) {
    return this.admin.createSellerMaterial(id, dto);
  }

  @Patch(':id/materials/:materialId')
  @ApiOperation({ summary: '판매자 자재/공급가 수정(Supabase materials)' })
  updateMaterial(
    @Param('id') id: string,
    @Param('materialId') materialId: string,
    @Body() dto: UpdateMaterialDto,
  ) {
    return this.admin.updateSellerMaterial(id, materialId, dto);
  }

  @Delete(':id/materials/:materialId')
  @ApiOperation({ summary: '판매자 자재/공급가 비활성화(Supabase materials)' })
  deleteMaterial(@Param('id') id: string, @Param('materialId') materialId: string) {
    return this.admin.deleteSellerMaterial(id, materialId);
  }
}
