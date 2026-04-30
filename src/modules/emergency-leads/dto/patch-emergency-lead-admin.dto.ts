import { IsIn, IsOptional } from 'class-validator';
import type { EmergencyMatchingStatus } from '../emergency-leads.types';

export class PatchEmergencyLeadAdminDto {
  @IsOptional()
  @IsIn(['pending', 'timed_out', 'contact_saved', 'converted_to_order'])
  matchingStatus?: EmergencyMatchingStatus;
}
