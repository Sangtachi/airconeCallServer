import type { OrdersRepositoryPort } from './orders.repository.port';
import type { CustomerOrderRow } from './orders.types';

export class MemoryOrdersRepository implements OrdersRepositoryPort {
  private rows: CustomerOrderRow[] = [];

  async insert(row: CustomerOrderRow): Promise<void> {
    this.rows.unshift(row);
  }

  async replace(row: CustomerOrderRow): Promise<void> {
    const i = this.rows.findIndex((r) => r.id === row.id);
    if (i === -1) this.rows.unshift(row);
    else this.rows[i] = row;
  }

  async findById(id: string): Promise<CustomerOrderRow | null> {
    return this.rows.find((r) => r.id === id) ?? null;
  }

  async listNewestFirst(): Promise<CustomerOrderRow[]> {
    return [...this.rows].sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    );
  }

  async appendMockProductPayment(_row: CustomerOrderRow): Promise<void> {
    /* in-memory에서는 별도 payments 테이블 없음 */
  }
}
