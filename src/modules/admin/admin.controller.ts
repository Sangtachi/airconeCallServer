import { Body, Controller, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { AdminRoleGuard } from '../../common/admin-role.guard';
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
  UpdateBookingStatusDto,
  UpdateCouponDto,
  UpdateMemberDto,
  UpdateSettlementStatusDto,
  UpdateTechnicianDto,
} from './admin.dto';

@ApiTags('admin')
@ApiHeader({ name: 'x-admin-role', required: true, description: 'admin | super_admin' })
@UseGuards(AdminRoleGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

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

  @Get('technicians')
  getTechnicians() { return this.service.getTechnicians(); }

  @Get('technician-onboarding')
  getOnboarding() { return this.service.getOnboarding(); }

  @Post('technician-onboarding/:id/review')
  reviewOnboarding(@Param('id') id: string, @Body() dto: ReviewOnboardingDto) {
    return this.service.reviewOnboarding(id, dto);
  }

  @Post('technicians')
  createTechnician(@Body() dto: CreateTechnicianDto) {
    return this.service.createTechnician(dto);
  }

  @Patch('technicians/:id')
  updateTechnician(@Param('id') id: string, @Body() dto: UpdateTechnicianDto) {
    return this.service.updateTechnician(id, dto);
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
    @Param('id') id: string,
    @Body() dto: ConfirmSettlementDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.service.confirmSettlement(id, dto, idempotencyKey);
  }

  @Patch('settlements/:id/status')
  updateSettlementStatus(@Param('id') id: string, @Body() dto: UpdateSettlementStatusDto) {
    return this.service.updateSettlementStatus(id, dto);
  }

  @Get('coupons')
  getCoupons() { return this.service.getCoupons(); }

  @Post('coupons')
  createCoupon(@Body() dto: CreateCouponDto) { return this.service.createCoupon(dto); }

  @Patch('coupons/:id')
  updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.service.updateCoupon(id, dto);
  }

  @Get('logs')
  getLogs() { return this.service.getAdminLogs(); }
}
