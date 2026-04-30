export type BookingStatus =
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

export type PaymentStatus = 'ready' | 'paid' | 'failed' | 'cancelled' | 'partial_cancelled';
export type SettlementStatus = 'pending' | 'confirmed' | 'paid' | 'held' | 'cancelled';

export interface Booking {
  id: string;
  bookingNo: string;
  customerName: string;
  customerPhone: string;
  region: string;
  symptomCode: string;
  urgency: string;
  status: BookingStatus;
  assignedTechnicianId: string | null;
  paymentStatus: PaymentStatus;
  adminMemo?: string;
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  workStatus: 'offline' | 'available' | 'busy';
  baseRegion?: string;
  feeRate: number;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  role: 'customer' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'banned';
  marketingConsent: boolean;
  createdAt: string;
  memo?: string;
}

export interface TechnicianOnboarding {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  documents: string[];
  rejectReason?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  paymentType: 'deposit' | 'final' | 'extra' | 'cancellation_fee';
  provider: 'manual' | 'toss' | 'portone';
  status: PaymentStatus;
  /** payments.order_id (Supabase 적용 시) */
  orderId?: string;
  dataSource?: 'memory' | 'database';
}

export interface Settlement {
  id: string;
  bookingId: string;
  technicianId: string;
  grossAmount: number;
  partsAmount: number;
  commissionBase: number;
  platformFee: number;
  technicianAmount: number;
  adjustmentAmount: number;
  status: SettlementStatus;
  /** order_settlements.order_id */
  orderId?: string;
  dataSource?: 'memory' | 'database';
}

export interface Coupon {
  id: string;
  userId: string;
  couponType: 'signup' | 'aircon_register' | 'referral' | 'manual';
  amount: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  expiresAt?: string;
  usedBookingId?: string | null;
}

export interface AdminLog {
  id: string;
  action: string;
  targetTable: string;
  targetId: string;
  createdAt: string;
  payload?: unknown;
}
