import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateMaterialDto, MemberSessionDto, RegisterMemberDto, RegisterSellerDto, UpdateMaterialDto } from './admin.dto';
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
