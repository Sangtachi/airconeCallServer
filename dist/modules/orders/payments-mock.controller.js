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
exports.PaymentsMockController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const mock_confirm_payment_dto_1 = require("./dto/mock-confirm-payment.dto");
const mock_payments_flag_1 = require("./mock-payments.flag");
const orders_service_1 = require("./orders.service");
let PaymentsMockController = class PaymentsMockController {
    constructor(orders) {
        this.orders = orders;
    }
    mockHealth() {
        return { mockPaymentsAllowed: (0, mock_payments_flag_1.isMockPaymentsAllowed)() };
    }
    paymentsConfigFlags() {
        return {
            mockPaymentsAllowed: (0, mock_payments_flag_1.isMockPaymentsAllowed)(),
            tossPaymentsSecretConfigured: Boolean(process.env.TOSS_PAYMENTS_SECRET_KEY?.trim()),
            tossPaymentsClientConfigured: Boolean(process.env.TOSS_PAYMENTS_CLIENT_KEY?.trim()),
            supabaseConfigured: Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
        };
    }
    async mockConfirm(dto) {
        if (!(0, mock_payments_flag_1.isMockPaymentsAllowed)()) {
            throw new common_1.ForbiddenException('mock payments are disabled — set NODE_ENV≠production or ENABLE_MOCK_PAYMENTS=true');
        }
        return this.orders.mockConfirmPayment(dto.orderId);
    }
};
exports.PaymentsMockController = PaymentsMockController;
__decorate([
    (0, common_1.Get)('payments/mock-health'),
    (0, swagger_1.ApiOperation)({
        summary: '모의 결제 허용 여부',
        description: '비프로덕션은 기본 허용, 프로덕션은 ENABLE_MOCK_PAYMENTS=true 필요. DISABLE_MOCK_PAYMENTS=true 로 강제 끔.',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentsMockController.prototype, "mockHealth", null);
__decorate([
    (0, common_1.Get)('payments/config-status'),
    (0, swagger_1.ApiOperation)({
        summary: 'PG 연동 ENV 존재 여부(값 미노출)',
        description: '로컬 점검용. Toss 키만 노출 이름으로 검사합니다.',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentsMockController.prototype, "paymentsConfigFlags", null);
__decorate([
    (0, common_1.Post)('payments/mock-confirm'),
    (0, swagger_1.ApiOperation)({
        summary: '모의 결제 확정',
        description: 'PG·사업자 없이 플로우 검증용. 허용 조건은 mock-health 참고.',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mock_confirm_payment_dto_1.MockConfirmPaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentsMockController.prototype, "mockConfirm", null);
exports.PaymentsMockController = PaymentsMockController = __decorate([
    (0, swagger_1.ApiTags)('payments-mock'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], PaymentsMockController);
//# sourceMappingURL=payments-mock.controller.js.map