import type { CatalogAirconType, CatalogServiceType } from '../service-catalog/service-catalog.types';

export type TechnicianSignupStatus =
  | 'pending'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type TechnicianWorkStatus = 'offline' | 'available' | 'busy' | 'reserved_only';

export interface TechnicianCapability {
  serviceType: CatalogServiceType;
  airconType: CatalogAirconType;
}

export interface TechnicianEntity {
  id: string;
  name: string;
  phone: string;
  passwordHash: string | null;
  businessType: 'individual' | 'sole_business' | 'company';
  businessNumber: string | null;
  careerYears: number | null;
  status: TechnicianSignupStatus;
  workStatus: TechnicianWorkStatus;
  baseRegion: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
  bankVerificationStatus: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  bankVerifiedAt: string | null;
  bankRejectReason: string | null;
  platformFeeRate: number;
  profilePhotoUrl: string | null;
  rejectReason: string | null;
  memo: string | null;
  createdAt: string;
  capabilities: TechnicianCapability[];
  regions: string[];
  availability: Array<'same_day' | 'reservation' | 'weekend' | 'night'>;
  documents: Array<{
    id: string;
    documentType: string;
    fileUrl: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
}
