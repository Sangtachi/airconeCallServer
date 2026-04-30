/**
 * 사업자·PG 없이 개발 시 모의 결제 허용 기준 (프로덕션에서는 명시 허용 시에만).
 */
export function isMockPaymentsAllowed(): boolean {
  if (process.env.DISABLE_MOCK_PAYMENTS === 'true') return false;
  if (process.env.ENABLE_MOCK_PAYMENTS === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}
