import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { EmergencyMatchingStatus } from '../emergency-leads.types';

export class ListEmergencyLeadsAdminQueryDto {
  @IsOptional()
  @IsIn(['pending', 'timed_out', 'contact_saved', 'converted_to_order'])
  matchingStatus?: EmergencyMatchingStatus;

  /** ISO 문자열 기준으로 created_at >= from 필터 */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  from?: string;

  /** ISO 문자열 기준으로 created_at <= to 필터 */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  to?: string;
}
