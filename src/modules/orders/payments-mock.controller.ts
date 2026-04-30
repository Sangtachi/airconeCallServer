import { Body, Controller, ForbiddenException, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MockConfirmPaymentDto } from './dto/mock-confirm-payment.dto';
import { isMockPaymentsAllowed } from './mock-payments.flag';
import { OrdersService } from './orders.service';

@ApiTags('payments-mock')
@Controller()
export class PaymentsMockController {
  constructor(private readonly orders: OrdersService) {}

  @Get('payments/mock-health')
  @ApiOperation({
    summary: '모의 결제 허용 여부',
    description: '비프로덕션은 기본 허용, 프로덕션은 ENABLE_MOCK_PAYMENTS=true 필요. DISABLE_MOCK_PAYMENTS=true 로 강제 끔.',
  })
  mockHealth() {
    return { mockPaymentsAllowed: isMockPaymentsAllowed() };
  }

  @Get('payments/config-status')
  @ApiOperation({
    summary: 'PG 연동 ENV 존재 여부(값 미노출)',
    description: '로컬 점검용. Toss 키만 노출 이름으로 검사합니다.',
  })
  paymentsConfigFlags() {
    return {
      mockPaymentsAllowed: isMockPaymentsAllowed(),
      tossPaymentsSecretConfigured: Boolean(process.env.TOSS_PAYMENTS_SECRET_KEY?.trim()),
      tossPaymentsClientConfigured: Boolean(process.env.TOSS_PAYMENTS_CLIENT_KEY?.trim()),
      supabaseConfigured: Boolean(
        process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
      ),
    };
  }

  @Post('payments/mock-confirm')
  @ApiOperation({
    summary: '모의 결제 확정',
    description: 'PG·사업자 없이 플로우 검증용. 허용 조건은 mock-health 참고.',
  })
  async mockConfirm(@Body() dto: MockConfirmPaymentDto) {
    if (!isMockPaymentsAllowed()) {
      throw new ForbiddenException({
        message: '이 환경에서는 테스트 결제를 사용할 수 없습니다.',
      });
    }
    return this.orders.mockConfirmPayment(dto.orderId);
  }
}
