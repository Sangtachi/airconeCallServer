import { Booking, Coupon, Payment, Settlement, Technician } from './admin.types';

/** Supabase 교체 시 여기 포트 시그니처를 유지하고 어댑터만 바꾼다. */
export interface BookingsRepoPort {
  list(): Booking[];
  getById(id: string): Booking | undefined;
  save(row: Booking): void;
}

export interface TechniciansRepoPort {
  list(): Technician[];
  getById(id: string): Technician | undefined;
  save(row: Technician): void;
}

export interface PaymentsRepoPort {
  list(): Payment[];
  getById(id: string): Payment | undefined;
  save(row: Payment): void;
}

export interface SettlementsRepoPort {
  list(): Settlement[];
  getById(id: string): Settlement | undefined;
  save(row: Settlement): void;
}

export interface CouponsRepoPort {
  list(): Coupon[];
  save(row: Coupon): void;
}
