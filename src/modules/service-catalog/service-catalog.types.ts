export type CatalogServiceType = 'install' | 'cleaning';
export type CatalogAirconType = 'wall' | 'stand' | 'two_in_one' | 'system';

export interface ServiceCategoryRow {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ServiceProductRow {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  serviceType: CatalogServiceType;
  airconType: CatalogAirconType;
  basePrice: number;
  sameDayExtraPrice: number;
  sameDayPrice: number;
  includedPipeMeter: number;
  includedRefrigerantCount: number;
  includedHoleCount: number;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ServiceAddonRow {
  id: string;
  name: string;
  code: string;
  unit: string;
  customerPrice: number | null;
  technicianCostAllowance: number | null;
  platformFeeRate: number | null;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
}
