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
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TechniciansService } from '../technicians/technicians.service';
import { AdminAccessGuard, AuthenticatedRoleRequest } from './admin-access.guard';
import { AdminService } from './admin.service';
import {
  AssignTechnicianDto,
  CancelPaymentDto,
  ConfirmSettlementDto,
  CreateBookingDto,
  CreateCouponDto,
  CreateMemberDto,
  CreateTechnicianDto,
  ReviewOnboardingDto,
  UpdateBookingDto,
  UpdateBookingStatusDto,
  UpdateCouponDto,
  UpdateMemberDto,
  UpdateOnboardingDto,
  UpdateSettlementStatusDto,
  UpdateTechnicianDto,
} from './admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-admin-role',
  required: false,
  description: '레거시 허용 시(ADMIN_LEGACY_X_ADMIN_ROLE unset|1). Bearer JWT 권장.',
})
@UseGuards(AdminAccessGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly service: AdminService,
    private readonly technicians: TechniciansService,
  ) {}

  @Get('dashboard')
  dashboard() { return this.service.getDashboard(); }

  @Get('members')
  getMembers() { return this.service.getMembers(); }

  @Get('members/:id')
  getMember(@Param('id') id: string) { return this.service.getMember(id); }

  @Post('members')
  createMember(@Body() dto: CreateMemberDto) { return this.service.createMember(dto); }

  @Patch('members/:id')
  updateMember(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.service.updateMember(id, dto);
  }

  @Delete('members/:id')
  deleteMember(@Param('id') id: string) {
    return this.service.deleteMember(id);
  }

  @Get('bookings')
  getBookings() { return this.service.getBookings(); }

  @Post('bookings')
  createBooking(@Body() dto: CreateBookingDto) { return this.service.createBooking(dto); }

  @Get('bookings/:id')
  getBooking(@Param('id') id: string) { return this.service.getBooking(id); }

  @Post('bookings/:id/assign-technician')
  assign(@Param('id') id: string, @Body() dto: AssignTechnicianDto) {
    return this.service.assignTechnician(id, dto);
  }

  @Post('bookings/:id/unassign-technician')
  unassign(@Param('id') id: string) { return this.service.unassignTechnician(id); }

  @Patch('bookings/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.service.updateBookingStatus(id, dto);
  }

  @Patch('bookings/:id')
  updateBooking(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.service.updateBooking(id, dto);
  }

  @Delete('bookings/:id')
  deleteBooking(@Param('id') id: string) {
    return this.service.deleteBooking(id);
  }

  @Get('technicians')
  getTechnicians() {
    return this.technicians.listAllBrief();
  }

  @Get('technician-onboarding')
  getOnboarding() {
    return this.technicians.getOnboardingRecords();
  }

  @Post('technician-onboarding/:id/review')
  reviewOnboarding(@Param('id') id: string, @Body() dto: ReviewOnboardingDto) {
    return this.technicians.reviewOnboarding(id, dto);
  }

  @Patch('technician-onboarding/:id')
  updateOnboarding(@Param('id') id: string, @Body() dto: UpdateOnboardingDto) {
    return this.technicians.updateOnboardingRecord(id, dto);
  }

  @Delete('technician-onboarding/:id')
  deleteOnboarding(@Param('id') id: string) {
    return this.technicians.deleteOnboardingRecord(id);
  }

  @Post('technicians')
  createTechnician(@Body() dto: CreateTechnicianDto) {
    return this.technicians.createByAdmin(dto);
  }

  @Patch('technicians/:id')
  updateTechnician(@Param('id') id: string, @Body() dto: UpdateTechnicianDto) {
    return this.technicians.updateByAdmin(id, dto);
  }

  @Delete('technicians/:id')
  deleteTechnician(@Param('id') id: string) {
    return this.technicians.deleteByAdmin(id);
  }

  @Get('payments')
  getPayments() { return this.service.getPayments(); }

  @Post('payments/:id/cancel')
  cancelPayment(
    @Param('id') id: string,
    @Body() dto: CancelPaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.service.cancelPayment(id, dto, idempotencyKey);
  }

  @Get('settlements')
  getSettlements() { return this.service.getSettlements(); }

  @Post('settlements/:id/confirm')
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
  settlementEvents(@Query('orderId') orderId?: string) {
    return this.service.listSettlementEvents(orderId);
  }

  @Get('coupons')
  getCoupons() { return this.service.getCoupons(); }

  @Post('coupons')
  createCoupon(@Body() dto: CreateCouponDto) { return this.service.createCoupon(dto); }

  @Patch('coupons/:id')
  updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.service.updateCoupon(id, dto);
  }

  @Delete('coupons/:id')
  deleteCoupon(@Param('id') id: string) {
    return this.service.deleteCoupon(id);
  }

  @Get('logs')
  getLogs() { return this.service.getAdminLogs(); }
}
