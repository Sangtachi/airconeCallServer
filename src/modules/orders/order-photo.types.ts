export type OrderPhotoKind = 'before_work' | 'after_work' | 'other';

export interface OrderPhotoRow {
  id: string;
  orderId: string;
  technicianId: string | null;
  kind: OrderPhotoKind;
  url: string;
  caption: string | null;
  createdAt: string;
}
