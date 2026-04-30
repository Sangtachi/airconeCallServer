import { Body, Controller, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { PatchEmergencyLeadContactDto } from './dto/patch-emergency-lead-contact.dto';
import { PatchEmergencyLeadTimeoutDto } from './dto/patch-emergency-lead-timeout.dto';
import { CreateEmergencyLeadDto } from './dto/create-emergency-lead.dto';
import { EmergencyLeadsService } from './emergency-leads.service';

@Controller('emergency-leads')
export class EmergencyLeadsPublicController {
  constructor(private readonly leads: EmergencyLeadsService) {}

  @Post()
  create(@Body() dto: CreateEmergencyLeadDto) {
    return this.leads.create(dto);
  }

  @Patch(':id/contact')
  patchContact(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: PatchEmergencyLeadContactDto) {
    return this.leads.patchContact(id, dto);
  }

  @Patch(':id/timeout')
  markTimeout(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: PatchEmergencyLeadTimeoutDto) {
    return this.leads.markTimeout(id, dto);
  }
}
