export type OrderScheduleType = 'same_day' | 'reservation';
export type OrderPaymentStatusSpec = 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refunded';
export type CustomerOrderLifecycleStatus =
  | 'created'
  | 'payment_pending'
  | 'paid'
  | 'matching'
  | 'assigned'
  | 'accepted'
  | 'on_the_way'
  | 'arrived'
  | 'diagnosed'
  | 'extra_payment_pending'
  | 'working'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'settlement_pending'
  | 'settled';

export interface CustomerOrderRow {
  id: string;
  orderNo: string;
  userId?: string | null;

  productId: string;
  productCode: string;
  productName: string;
  serviceType: string;
  airconType: string;
  scheduleType: OrderScheduleType;

  desiredDate?: string | null;
  desiredTimeSlot?: string | null;

  addressSummary: string;
  sido?: string | null;
  sigungu?: string | null;
  dong?: string | null;
  detailAddress?: string | null;

  customerName: string;
  customerPhone: string;

  /** 스냅샷 및 금액 분해(DDL base_price 등과 대응) */
  basePrice: number;
  sameDayExtraPrice: number;

  /** 상품 라인 금액(예약=기본, 당일=당일가) */
  productTotalPrice: number;
  /** 추가금 견적 합계(초안은 대개 0) */
  extraTotalPrice: number;
  discountAmount: number;
  totalPrice: number;

  paymentStatus: OrderPaymentStatusSpec;
  orderStatus: CustomerOrderLifecycleStatus;

  assignedTechnicianId: string | null;
  customerMemo?: string | null;
  adminMemo?: string | null;
  createdAt: string;
  updatedAt: string;
}
