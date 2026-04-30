import type { CustomerOrderRow } from './orders.types';

export const ORDERS_REPO = Symbol('ORDERS_REPO');

export interface OrdersRepositoryPort {
  insert(row: CustomerOrderRow): Promise<void>;
  replace(row: CustomerOrderRow): Promise<void>;
  findById(id: string): Promise<CustomerOrderRow | null>;
  listNewestFirst(): Promise<CustomerOrderRow[]>;
  /** 모의 확정 후 상품결제 레코드(멱등) */
  appendMockProductPayment(row: CustomerOrderRow): Promise<void>;
}
