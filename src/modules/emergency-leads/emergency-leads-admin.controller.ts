import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminRoleGuard, AdminRoles } from '../../common/admin-role.guard';
import { AdminAccessGuard } from '../admin/admin-access.guard';
import { PatchEmergencyLeadAdminDto } from './dto/patch-emergency-lead-admin.dto';
import { ListEmergencyLeadsAdminQueryDto } from './dto/list-emergency-leads-admin-query.dto';
import { EmergencyLeadsService } from './emergency-leads.service';

@ApiTags('admin-emergency-leads')
@ApiSecurity('admin-role')
@ApiHeader({ name: 'x-admin-role', required: false })
@UseGuards(AdminAccessGuard, AdminRoleGuard)
@Controller('admin/emergency-leads')
export class EmergencyLeadsAdminController {
  constructor(private readonly leads: EmergencyLeadsService) {}

  @Get()
  @AdminRoles('dispatch_admin', 'ops_admin')
  list(@Query() q: ListEmergencyLeadsAdminQueryDto) {
    return this.leads.listAdmin({
      matchingStatus: q.matchingStatus,
      fromIso: q.from ?? undefined,
      toIso: q.to ?? undefined,
    });
  }

  @Patch(':id')
  @AdminRoles('ops_admin')
  patch(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: PatchEmergencyLeadAdminDto) {
    return this.leads.patchAdmin(id, dto);
  }
}
