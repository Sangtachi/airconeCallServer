import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import type { Express } from 'express';
import { CreateMaterialPurchaseOrderDto } from '../admin/admin.dto';
import { TechnicianCreateQuoteDto } from '../orders/dto/extra-quotes.dto';
import {
  TechnicianPhotoConfirmDto,
  TechnicianPhotoMultipartMetaDto,
  TechnicianPhotoPresignDto,
} from '../orders/dto/technician-photo-upload.dto';
import { ExtraQuotesService } from '../orders/extra-quotes.service';
import { OrdersService } from '../orders/orders.service';
import { TechnicianApprovedGuard, type TechnicianRequest } from './technician-approved.guard';
import {
  TechnicianDispatchOffersQueryDto,
  TechnicianDispatchPreferencesDto,
  TechnicianOrderPhotoDto,
  TechnicianWorkStatusDto,
} from './technician.dto';
import { TechniciansService } from './technicians.service';

const ALLOWED_IMAGE_MIME = /^image\/(jpeg|jpg|png|webp|heic|heif)$/i;

@ApiTags('technician-portal')
@ApiHeader({ name: 'x-technician-id', required: true })
@UseGuards(TechnicianApprovedGuard)
@Controller()
export class TechnicianPortalController {
  constructor(
    private readonly orders: OrdersService,
    private readonly extraQuotes: ExtraQuotesService,
    private readonly technicians: TechniciansService,
  ) {}

  @Get('technician/me')
  me(@Req() req: TechnicianRequest) {
    const t = req.technician!;
    return {
      id: t.id,
      name: t.name,
      phone: `${t.phone.slice(0, 3)}****${t.phone.slice(-4)}`,
      status: t.status,
      workStatus: t.workStatus,
      baseRegion: t.baseRegion,
      capabilities: t.capabilities,
      regions: t.regions,
      availability: t.availability,
      bankName: t.bankName,
      bankHolder: t.bankHolder,
      bankAccountMasked: t.bankAccount ? `${'*'.repeat(Math.max(0, t.bankAccount.replace(/\D/g, '').length - 4))}${t.bankAccount.replace(/\D/g, '').slice(-4)}` : null,
      bankVerificationStatus: t.bankVerificationStatus,
      bankRejectReason: t.bankRejectReason,
    };
  }

  @Patch('technician/me/work-status')
  updateWorkStatus(@Req() req: TechnicianRequest, @Body() dto: TechnicianWorkStatusDto) {
    return this.technicians.updateWorkStatus(req.technician!.id, dto.workStatus);
  }

  @Get('technician/partner/home')
  partnerHome(@Req() req: TechnicianRequest) {
    return this.orders.technicianPartnerHome(req.technician!);
  }

  @Get('technician/dispatch/offers')
  dispatchOffers(@Req() req: TechnicianRequest, @Query() query: TechnicianDispatchOffersQueryDto) {
    return this.orders.technicianListDispatchOffers(req.technician!, query);
  }

  @Post('technician/dispatch/offers/:orderId/accept')
  acceptDispatchOffer(@Req() req: TechnicianRequest, @Param('orderId') orderId: string) {
    return this.orders.technicianAcceptDispatchOffer(req.technician!, orderId);
  }

  @Post('technician/dispatch/offers/:orderId/reject')
  rejectDispatchOffer(@Req() req: TechnicianRequest, @Param('orderId') orderId: string) {
    return this.orders.technicianRejectDispatchOffer(req.technician!, orderId);
  }

  @Get('technician/preferences')
  preferences(@Req() req: TechnicianRequest) {
    return this.orders.technicianGetDispatchPreferences(req.technician!);
  }

  @Patch('technician/preferences')
  updatePreferences(@Req() req: TechnicianRequest, @Body() dto: TechnicianDispatchPreferencesDto) {
    return this.orders.technicianUpdateDispatchPreferences(req.technician!, dto);
  }

  @Get('technician/reviews')
  reviews(@Req() req: TechnicianRequest) {
    return this.orders.technicianListReviews(req.technician!.id);
  }

  @Get('technician/jobs')
  jobs(@Req() req: TechnicianRequest) {
    return this.orders.technicianListJobs(req.technician!.id);
  }

  @Get('technician/jobs/:orderId')
  jobDetail(@Req() req: TechnicianRequest, @Param('orderId') orderId: string) {
    return this.orders.technicianGetJob(req.technician!.id, orderId);
  }

  @Patch('technician/jobs/:orderId/accept')
  accept(@Req() req: TechnicianRequest, @Param('orderId') orderId: string) {
    return this.orders.technicianAcceptJob(req.technician!.id, orderId);
  }

  @Patch('technician/jobs/:orderId/depart')
  depart(@Req() req: TechnicianRequest, @Param('orderId') orderId: string) {
    return this.orders.technicianDepartJob(req.technician!.id, orderId);
  }

  @Patch('technician/jobs/:orderId/start')
  start(@Req() req: TechnicianRequest, @Param('orderId') orderId: string) {
    return this.orders.technicianStartWork(req.technician!.id, orderId);
  }

  @Patch('technician/jobs/:orderId/complete')
  complete(@Req() req: TechnicianRequest, @Param('orderId') orderId: string) {
    return this.orders.technicianCompleteJob(req.technician!.id, orderId);
  }

  @Get('technician/settlements')
  settlements(@Req() req: TechnicianRequest) {
    return this.orders.technicianListSettlements(req.technician!.id);
  }

  @Post('technician/settlements/:settlementId/request-payout')
  requestPayout(@Req() req: TechnicianRequest, @Param('settlementId') settlementId: string) {
    return this.orders.technicianRequestSettlementPayout(req.technician!.id, settlementId);
  }

  @Get('technician/materials')
  materials(@Req() req: TechnicianRequest) {
    void req.technician;
    return this.orders.technicianListMaterials();
  }

  @Get('technician/material-orders')
  materialOrders(@Req() req: TechnicianRequest) {
    return this.orders.technicianListMaterialOrders(req.technician!.id);
  }

  @Post('technician/material-orders')
  createMaterialOrder(@Req() req: TechnicianRequest, @Body() dto: CreateMaterialPurchaseOrderDto) {
    return this.orders.technicianCreateMaterialOrder(req.technician!, dto);
  }

  @Post('technician/jobs/:orderId/extra-quotes')
  createExtraQuote(
    @Req() req: TechnicianRequest,
    @Param('orderId') orderId: string,
    @Body() dto: TechnicianCreateQuoteDto,
  ) {
    return this.extraQuotes.technicianCreateQuote(req.technician!.id, orderId, dto);
  }

  @Get('technician/jobs/:orderId/extra-quotes')
  listExtraQuotes(@Req() req: TechnicianRequest, @Param('orderId') orderId: string) {
    return this.extraQuotes.technicianListQuotes(req.technician!.id, orderId);
  }

  @Get('technician/jobs/:orderId/photos')
  listPhotos(@Req() req: TechnicianRequest, @Param('orderId') orderId: string) {
    return this.orders.technicianListOrderPhotos(req.technician!.id, orderId);
  }

  /** 공개 URL 문자열 등록(Supabase). */
  @Post('technician/jobs/:orderId/photos')
  addPhoto(
    @Req() req: TechnicianRequest,
    @Param('orderId') orderId: string,
    @Body() dto: TechnicianOrderPhotoDto,
  ) {
    return this.orders.technicianAddOrderPhoto(req.technician!.id, orderId, dto);
  }

  @Post('technician/jobs/:orderId/photos/presign')
  presignPhoto(
    @Req() req: TechnicianRequest,
    @Param('orderId') orderId: string,
    @Body() dto: TechnicianPhotoPresignDto,
  ) {
    return this.orders.technicianPresignOrderPhoto(req.technician!.id, orderId, dto);
  }

  @Post('technician/jobs/:orderId/photos/confirm-upload')
  confirmUploadedPhoto(
    @Req() req: TechnicianRequest,
    @Param('orderId') orderId: string,
    @Body() dto: TechnicianPhotoConfirmDto,
  ) {
    return this.orders.technicianConfirmStoragePhoto(req.technician!.id, orderId, dto);
  }

  @Post('technician/jobs/:orderId/photos/upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  uploadMultipartPhoto(
    @Req() req: TechnicianRequest,
    @Param('orderId') orderId: string,
    @Body() dto: TechnicianPhotoMultipartMetaDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.buffer?.length) throw new BadRequestException('file required');
    if (!ALLOWED_IMAGE_MIME.test(file.mimetype || '')) throw new BadRequestException('unsupported image type');
    return this.orders.technicianUploadMultipartPhoto(req.technician!.id, orderId, dto.kind, file, dto.caption);
  }
}
