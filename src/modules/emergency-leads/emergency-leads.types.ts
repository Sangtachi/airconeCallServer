export type EmergencyMatchingStatus =
  | 'pending'
  | 'timed_out'
  | 'contact_saved'
  | 'converted_to_order';

export type EmergencyUrgency = 'now' | 'scheduled';

export type EmergencyLeadRow = {
  id: string;
  clientSessionId: string;
  locationText: string;
  airconType: string;
  issueText: string;
  urgency: EmergencyUrgency;
  quotedFeeKrw: number;
  matchingTimeoutSeconds: number;
  matchingStartedAt: string;
  matchingDeadlineAt: string;
  matchingStatus: EmergencyMatchingStatus;
  customerPhone: string | null;
  customerName: string | null;
  userId: string | null;
  convertedOrderId: string | null;
  /** Deprecated compatibility field. 신규 전환에서는 convertedOrderId와 같은 order id를 기록한다. */
  convertedBookingId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmergencyLeadListFilters = {
  matchingStatus?: EmergencyMatchingStatus;
  fromIso?: string;
  toIso?: string;
};
