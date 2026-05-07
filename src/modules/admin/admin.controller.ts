import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminRoleGuard, AdminRoles } from '../../common/admin-role.guard';
import { TechniciansService } from '../technicians/technicians.service';
import { AdminAccessGuard, AuthenticatedRoleRequest } from './admin-access.guard';
import { AdminService } from './admin.service';
import {
  AssignTechnicianDto,
  CancelPaymentDto,
  ConfirmSettlementDto,
  CreateBookingDto,
  CreateCouponDto,
  CreateMaterialDto,
  CreateMemberDto,
  CreateSellerDto,
  CreateTechnicianDto,
  ReviewOnboardingDto,
  UpdateBookingDto,
  UpdateBookingStatusDto,
  UpdateCouponDto,
  UpdateMaterialDto,
  UpdateMaterialPurchaseOrderDto,
  UpdateMemberDto,
  UpdateSellerDto,
  UpdateOnboardingDto,
  UpdateSettlementStatusDto,
  UpdateTechnicianDto,
} from './admin.dto';

@ApiTags('admin')
@ApiSecurity('admin-role')
@ApiHeader({
  name: 'x-admin-role',
  required: false,
  description: 'JWT 미사용. role-only: dispatch_admin | ops_admin | finance_admin | super_admin',
})
@UseGuards(AdminAccessGuard, AdminRoleGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly service: AdminService,
    private readonly technicians: TechniciansService,
  ) {}

  @Get('dashboard')
  @AdminRoles('dispatch_admin', 'ops_admin', 'finance_admin')
  dashboard() { return this.service.getDashboard(); }

  @Get('members')
  @AdminRoles('ops_admin')
  getMembers() { return this.service.getMembers(); }

  @Get('members/:id')
  @AdminRoles('ops_admin')
  getMember(@Param('id') id: string) { return this.service.getMember(id); }

  @Post('members')
  @AdminRoles('ops_admin')
  createMember(@Body() dto: CreateMemberDto) { return this.service.createMember(dto); }

  @Patch('members/:id')
  @AdminRoles('ops_admin')
  updateMember(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.service.updateMember(id, dto);
  }

  @Delete('members/:id')
  @AdminRoles('ops_admin')
  deleteMember(@Param('id') id: string) {
    return this.service.deleteMember(id);
  }

  @Get('sellers')
  @AdminRoles('ops_admin')
  getSellers() { return this.service.getSellers(); }

  @Post('sellers')
  @AdminRoles('ops_admin')
  createSeller(@Body() dto: CreateSellerDto) { return this.service.createSeller(dto); }

  @Patch('sellers/:id')
  @AdminRoles('ops_admin')
  updateSeller(@Param('id') id: string, @Body() dto: UpdateSellerDto) {
    return this.service.updateSeller(id, dto);
  }

  @Delete('sellers/:id')
  @AdminRoles('ops_admin')
  deleteSeller(@Param('id') id: string) {
    return this.service.deleteSeller(id);
  }

  @Get('bookings')
  @AdminRoles('dispatch_admin', 'ops_admin')
  getBookings() { return this.service.getBookings(); }

  @Post('bookings')
  @AdminRoles('ops_admin')
  createBooking(@Body() dto: CreateBookingDto) { return this.service.createBooking(dto); }

  @Get('bookings/:id')
  @AdminRoles('dispatch_admin', 'ops_admin')
  getBooking(@Param('id') id: string) { return this.service.getBooking(id); }

  @Post('bookings/:id/assign-technician')
  @AdminRoles('ops_admin')
  assign(@Param('id') id: string, @Body() dto: AssignTechnicianDto) {
    return this.service.assignTechnician(id, dto);
  }

  @Post('bookings/:id/unassign-technician')
  @AdminRoles('ops_admin')
  unassign(@Param('id') id: string) { return this.service.unassignTechnician(id); }

  @Patch('bookings/:id/status')
  @AdminRoles('ops_admin')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.service.updateBookingStatus(id, dto);
  }

  @Patch('bookings/:id')
  @AdminRoles('ops_admin')
  updateBooking(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.service.updateBooking(id, dto);
  }

  @Delete('bookings/:id')
  @AdminRoles('ops_admin')
  deleteBooking(@Param('id') id: string) {
    return this.service.deleteBooking(id);
  }

  @Get('technicians')
  @AdminRoles('dispatch_admin', 'ops_admin')
  getTechnicians() {
    return this.technicians.listAllBrief();
  }

  @Get('technician-onboarding')
  @AdminRoles('ops_admin')
  getOnboarding() {
    return this.technicians.getOnboardingRecords();
  }

  @Post('technician-onboarding/:id/review')
  @AdminRoles('ops_admin')
  reviewOnboarding(@Param('id') id: string, @Body() dto: ReviewOnboardingDto) {
    return this.technicians.reviewOnboarding(id, dto);
  }

  @Patch('technician-onboarding/:id')
  @AdminRoles('ops_admin')
  updateOnboarding(@Param('id') id: string, @Body() dto: UpdateOnboardingDto) {
    return this.technicians.updateOnboardingRecord(id, dto);
  }

  @Delete('technician-onboarding/:id')
  @AdminRoles('ops_admin')
  deleteOnboarding(@Param('id') id: string) {
    return this.technicians.deleteOnboardingRecord(id);
  }

  @Post('technicians')
  @AdminRoles('ops_admin')
  createTechnician(@Body() dto: CreateTechnicianDto) {
    return this.technicians.createByAdmin(dto);
  }

  @Patch('technicians/:id')
  @AdminRoles('ops_admin')
  updateTechnician(@Param('id') id: string, @Body() dto: UpdateTechnicianDto) {
    return this.technicians.updateByAdmin(id, dto);
  }

  @Delete('technicians/:id')
  @AdminRoles('ops_admin')
  deleteTechnician(@Param('id') id: string) {
    return this.technicians.deleteByAdmin(id);
  }

  @Get('materials')
  @AdminRoles('ops_admin')
  getMaterials() {
    return this.service.getMaterials();
  }

  @Post('materials')
  @AdminRoles('ops_admin')
  createMaterial(@Body() dto: CreateMaterialDto) {
    return this.service.createMaterial(dto);
  }

  @Patch('materials/:id')
  @AdminRoles('ops_admin')
  updateMaterial(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.service.updateMaterial(id, dto);
  }

  @Delete('materials/:id')
  @AdminRoles('ops_admin')
  deleteMaterial(@Param('id') id: string) {
    return this.service.deleteMaterial(id);
  }

  @Get('material-orders')
  @AdminRoles('ops_admin')
  getMaterialOrders() {
    return this.service.getMaterialPurchaseOrders();
  }

  @Patch('material-orders/:id')
  @AdminRoles('ops_admin')
  updateMaterialOrder(@Param('id') id: string, @Body() dto: UpdateMaterialPurchaseOrderDto) {
    return this.service.updateAdminMaterialPurchaseOrder(id, dto);
  }

  @Get('sellers/:id/preview-session')
  @AdminRoles('ops_admin')
  sellerPreviewSession(@Param('id') id: string) {
    return this.service.sellerPreviewSession(id);
  }

  @Get('technicians/:id/preview-session')
  @AdminRoles('ops_admin')
  technicianPreviewSession(@Param('id') id: string) {
    return this.service.technicianPreviewSession(id);
  }

  @Get('payments')
  @AdminRoles('dispatch_admin', 'finance_admin')
  getPayments() { return this.service.getPayments(); }

  @Post('payments/:id/cancel')
  @AdminRoles('finance_admin')
  cancelPayment(
    @Param('id') id: string,
    @Body() dto: CancelPaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.service.cancelPayment(id, dto, idempotencyKey);
  }

  @Get('settlements')
  @AdminRoles('dispatch_admin', 'finance_admin')
  getSettlements() { return this.service.getSettlements(); }

  @Post('settlements/:id/confirm')
  @AdminRoles('finance_admin')
  confirmSettlement(
    @Req() req: AuthenticatedRoleRequest,
    @Param('id') id: string,
    @Body() dto: ConfirmSettlementDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.service.confirmSettlement(id, dto, idempotencyKey, {
      actor: req.adminSubject ?? 'admin',
      idempotencyKey,
    });
  }

  @Patch('settlements/:id/status')
  @AdminRoles('finance_admin')
  updateSettlementStatus(
    @Req() req: AuthenticatedRoleRequest,
    @Param('id') id: string,
    @Body() dto: UpdateSettlementStatusDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.service.updateSettlementStatus(id, dto, {
      actor: req.adminSubject ?? 'admin',
      idempotencyKey,
    });
  }

  @Delete('settlements/:id')
  @AdminRoles('finance_admin')
  deleteSettlement(
    @Req() req: AuthenticatedRoleRequest,
    @Param('id') id: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.service.deleteSettlement(id, {
      actor: req.adminSubject ?? 'admin',
      idempotencyKey,
    });
  }

  @Get('settlement-events')
  @ApiOperation({ summary: '정산 변경 감사(멱등키·액터 포함, Supabase DDL 필요)' })
  @ApiQuery({ name: 'orderId', required: false })
  @AdminRoles('dispatch_admin', 'finance_admin')
  settlementEvents(@Query('orderId') orderId?: string) {
    return this.service.listSettlementEvents(orderId);
  }

  @Get('coupons')
  @AdminRoles('finance_admin', 'ops_admin')
  getCoupons() { return this.service.getCoupons(); }

  @Post('coupons')
  @AdminRoles('finance_admin', 'ops_admin')
  createCoupon(@Body() dto: CreateCouponDto) { return this.service.createCoupon(dto); }

  @Patch('coupons/:id')
  @AdminRoles('finance_admin', 'ops_admin')
  updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.service.updateCoupon(id, dto);
  }

  @Delete('coupons/:id')
  @AdminRoles('finance_admin', 'ops_admin')
  deleteCoupon(@Param('id') id: string) {
    return this.service.deleteCoupon(id);
  }

  @Get('logs')
  @AdminRoles('super_admin')
  getLogs() { return this.service.getAdminLogs(); }
}
