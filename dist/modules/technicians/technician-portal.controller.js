"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnicianPortalController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const admin_dto_1 = require("../admin/admin.dto");
const notification_dto_1 = require("../notifications/notification.dto");
const notification_service_1 = require("../notifications/notification.service");
const extra_quotes_dto_1 = require("../orders/dto/extra-quotes.dto");
const technician_photo_upload_dto_1 = require("../orders/dto/technician-photo-upload.dto");
const extra_quotes_service_1 = require("../orders/extra-quotes.service");
const orders_service_1 = require("../orders/orders.service");
const technician_approved_guard_1 = require("./technician-approved.guard");
const technician_dto_1 = require("./technician.dto");
const technicians_service_1 = require("./technicians.service");
const ALLOWED_IMAGE_MIME = /^image\/(jpeg|jpg|png|webp|heic|heif)$/i;
let TechnicianPortalController = class TechnicianPortalController {
    constructor(orders, extraQuotes, technicians, notifications) {
        this.orders = orders;
        this.extraQuotes = extraQuotes;
        this.technicians = technicians;
        this.notifications = notifications;
    }
    me(req) {
        const t = req.technician;
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
    updateWorkStatus(req, dto) {
        return this.technicians.updateWorkStatus(req.technician.id, dto.workStatus);
    }
    registerNotificationDevice(req, dto, userAgent) {
        return this.notifications.registerDevice('technician', req.technician.id, dto, userAgent);
    }
    partnerHome(req) {
        return this.orders.technicianPartnerHome(req.technician);
    }
    dispatchOffers(req, query) {
        return this.orders.technicianListDispatchOffers(req.technician, query);
    }
    acceptDispatchOffer(req, orderId) {
        return this.orders.technicianAcceptDispatchOffer(req.technician, orderId);
    }
    rejectDispatchOffer(req, orderId) {
        return this.orders.technicianRejectDispatchOffer(req.technician, orderId);
    }
    preferences(req) {
        return this.orders.technicianGetDispatchPreferences(req.technician);
    }
    updatePreferences(req, dto) {
        return this.orders.technicianUpdateDispatchPreferences(req.technician, dto);
    }
    reviews(req) {
        return this.orders.technicianListReviews(req.technician.id);
    }
    jobs(req) {
        return this.orders.technicianListJobs(req.technician.id);
    }
    jobDetail(req, orderId) {
        return this.orders.technicianGetJob(req.technician.id, orderId);
    }
    accept(req, orderId) {
        return this.orders.technicianAcceptJob(req.technician.id, orderId);
    }
    depart(req, orderId) {
        return this.orders.technicianDepartJob(req.technician.id, orderId);
    }
    start(req, orderId) {
        return this.orders.technicianStartWork(req.technician.id, orderId);
    }
    complete(req, orderId) {
        return this.orders.technicianCompleteJob(req.technician.id, orderId);
    }
    settlements(req) {
        return this.orders.technicianListSettlements(req.technician.id);
    }
    requestPayout(req, settlementId) {
        return this.orders.technicianRequestSettlementPayout(req.technician.id, settlementId);
    }
    materials(req) {
        void req.technician;
        return this.orders.technicianListMaterials();
    }
    materialOrders(req) {
        return this.orders.technicianListMaterialOrders(req.technician.id);
    }
    createMaterialOrder(req, dto) {
        return this.orders.technicianCreateMaterialOrder(req.technician, dto);
    }
    createExtraQuote(req, orderId, dto) {
        return this.extraQuotes.technicianCreateQuote(req.technician.id, orderId, dto);
    }
    listExtraQuotes(req, orderId) {
        return this.extraQuotes.technicianListQuotes(req.technician.id, orderId);
    }
    listPhotos(req, orderId) {
        return this.orders.technicianListOrderPhotos(req.technician.id, orderId);
    }
    addPhoto(req, orderId, dto) {
        return this.orders.technicianAddOrderPhoto(req.technician.id, orderId, dto);
    }
    presignPhoto(req, orderId, dto) {
        return this.orders.technicianPresignOrderPhoto(req.technician.id, orderId, dto);
    }
    confirmUploadedPhoto(req, orderId, dto) {
        return this.orders.technicianConfirmStoragePhoto(req.technician.id, orderId, dto);
    }
    uploadMultipartPhoto(req, orderId, dto, file) {
        if (!file?.buffer?.length)
            throw new common_1.BadRequestException('file required');
        if (!ALLOWED_IMAGE_MIME.test(file.mimetype || ''))
            throw new common_1.BadRequestException('unsupported image type');
        return this.orders.technicianUploadMultipartPhoto(req.technician.id, orderId, dto.kind, file, dto.caption);
    }
};
exports.TechnicianPortalController = TechnicianPortalController;
__decorate([
    (0, common_1.Get)('technician/me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "me", null);
__decorate([
    (0, common_1.Patch)('technician/me/work-status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, technician_dto_1.TechnicianWorkStatusDto]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "updateWorkStatus", null);
__decorate([
    (0, common_1.Post)('technician/notifications/devices'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, notification_dto_1.RegisterNotificationDeviceDto, String]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "registerNotificationDevice", null);
__decorate([
    (0, common_1.Get)('technician/partner/home'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "partnerHome", null);
__decorate([
    (0, common_1.Get)('technician/dispatch/offers'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, technician_dto_1.TechnicianDispatchOffersQueryDto]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "dispatchOffers", null);
__decorate([
    (0, common_1.Post)('technician/dispatch/offers/:orderId/accept'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "acceptDispatchOffer", null);
__decorate([
    (0, common_1.Post)('technician/dispatch/offers/:orderId/reject'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "rejectDispatchOffer", null);
__decorate([
    (0, common_1.Get)('technician/preferences'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "preferences", null);
__decorate([
    (0, common_1.Patch)('technician/preferences'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, technician_dto_1.TechnicianDispatchPreferencesDto]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Get)('technician/reviews'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "reviews", null);
__decorate([
    (0, common_1.Get)('technician/jobs'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "jobs", null);
__decorate([
    (0, common_1.Get)('technician/jobs/:orderId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "jobDetail", null);
__decorate([
    (0, common_1.Patch)('technician/jobs/:orderId/accept'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "accept", null);
__decorate([
    (0, common_1.Patch)('technician/jobs/:orderId/depart'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "depart", null);
__decorate([
    (0, common_1.Patch)('technician/jobs/:orderId/start'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "start", null);
__decorate([
    (0, common_1.Patch)('technician/jobs/:orderId/complete'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "complete", null);
__decorate([
    (0, common_1.Get)('technician/settlements'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "settlements", null);
__decorate([
    (0, common_1.Post)('technician/settlements/:settlementId/request-payout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('settlementId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "requestPayout", null);
__decorate([
    (0, common_1.Get)('technician/materials'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "materials", null);
__decorate([
    (0, common_1.Get)('technician/material-orders'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "materialOrders", null);
__decorate([
    (0, common_1.Post)('technician/material-orders'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_dto_1.CreateMaterialPurchaseOrderDto]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "createMaterialOrder", null);
__decorate([
    (0, common_1.Post)('technician/jobs/:orderId/extra-quotes'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, extra_quotes_dto_1.TechnicianCreateQuoteDto]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "createExtraQuote", null);
__decorate([
    (0, common_1.Get)('technician/jobs/:orderId/extra-quotes'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "listExtraQuotes", null);
__decorate([
    (0, common_1.Get)('technician/jobs/:orderId/photos'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "listPhotos", null);
__decorate([
    (0, common_1.Post)('technician/jobs/:orderId/photos'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, technician_dto_1.TechnicianOrderPhotoDto]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "addPhoto", null);
__decorate([
    (0, common_1.Post)('technician/jobs/:orderId/photos/presign'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, technician_photo_upload_dto_1.TechnicianPhotoPresignDto]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "presignPhoto", null);
__decorate([
    (0, common_1.Post)('technician/jobs/:orderId/photos/confirm-upload'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, technician_photo_upload_dto_1.TechnicianPhotoConfirmDto]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "confirmUploadedPhoto", null);
__decorate([
    (0, common_1.Post)('technician/jobs/:orderId/photos/upload'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 15 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, technician_photo_upload_dto_1.TechnicianPhotoMultipartMetaDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicianPortalController.prototype, "uploadMultipartPhoto", null);
exports.TechnicianPortalController = TechnicianPortalController = __decorate([
    (0, swagger_1.ApiTags)('technician-portal'),
    (0, swagger_1.ApiHeader)({ name: 'x-technician-id', required: true }),
    (0, common_1.UseGuards)(technician_approved_guard_1.TechnicianApprovedGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [orders_service_1.OrdersService,
        extra_quotes_service_1.ExtraQuotesService,
        technicians_service_1.TechniciansService,
        notification_service_1.NotificationService])
], TechnicianPortalController);
//# sourceMappingURL=technician-portal.controller.js.map