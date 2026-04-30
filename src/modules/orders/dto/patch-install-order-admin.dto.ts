import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsIn, IsOptional, IsString } from 'class-validator';

const STATUSES = [
  'created',
  'paid',
  'matching',
  'assigned',
  'accepted',
  'on_the_way',
  'working',
  'completed',
  'cancelled',
  'refunded',
] as const;

export type AdminPatchableOrderStatus = (typeof STATUSES)[number];

export class PatchInstallOrderAdminDto {
  @ApiProperty({ required: false, enum: STATUSES })
  @IsOptional()
  @IsIn([...STATUSES])
  orderStatus?: AdminPatchableOrderStatus;

  @ApiProperty({
    required: false,
    nullable: true,
    description: '기사 식별자(t_1 등). 빈 문자열이면 미배정으로 저장.',
  })
  @Allow()
  @IsOptional()
  assignedTechnicianId?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  adminMemo?: string;
}
