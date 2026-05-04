/**
 * 레거시 Booking 필드와 canonical orders/payments 모델의 호환 매핑.
 * 신규 운영 상태는 orders.order_status / orders.payment_status를 기준으로 둔다.
 */

/** 명세 주문 상태 (일부 단계 통합 가능) */
export type SpecOrderStatus =
  | 'created'
  | 'paid'
  | 'matching'
  | 'assigned'
  | 'accepted'
  | 'on_the_way'
  | 'working'
  | 'completed'
  | 'cancelled'
  | 'refunded';

/** 명세 결제 상태 */
export type SpecPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refunded';

/** 명세 서비스·유형 코드 (표준 snake / enum) */
export type SpecServiceType = 'install' | 'cleaning';
export type SpecAirconType = 'wall' | 'stand' | 'two_in_one' | 'system';
export type SpecScheduleType = 'same_day' | 'reservation';

/**
 * 레거시 Booking 필드 ↔ 명세 Order 필드
 * | 레거지 (Booking)      | 명세 (Order)           | 비고 |
 * | --------------------- | ---------------------- | --- |
 * | bookingNo             | order_no               | 번호 규칙 통일 필요 |
 * | customerName          | → user 참조 또는 스냅샷 | 1차 user_id + 스냅샷 |
 * | region, symptomCode   | 주소 계층·상품 선택     | symptomCode 폐기, product_id 로 대체 예정 |
 * | urgency               | schedule_type          | now → same_day 등 매핑 |
 * | status                | order_status           | 세부 상태 1:1 재검증 |
 * | assignedTechnicianId  | assigned_technician_id | 동일 의미 |
 * | paymentStatus         | payment_status (중복 허용 vs payments 단일 진실원) | C팀 설계 시 정규화 |
 */
export interface LegacyBookingToOrderFieldMap {
  bookingNo: 'order_no';
  customerName: 'customer_display_name_snap';
  customerPhone: 'customer_phone_snap';
  region: 'address_summary_snap';
  symptomCode: 'replaced_by_product_id';
  urgency: 'schedule_type_derivation_source';
  status: 'order_status';
  assignedTechnicianId: 'assigned_technician_id';
  paymentStatus: 'payment_status_aggregate_or_derived';
  adminMemo: 'admin_memo';
}

/** 결제 레코드: 레거시 Payment ↔ 명세 payments */
export interface LegacyPaymentToSpecPaymentMap {
  bookingId: 'order_id';
  amount: 'amount';
  paymentType: 'payment_type'; // product | extra | cancellation_fee
  provider: 'provider'; // toss | portone | manual
  status: 'status';
}
