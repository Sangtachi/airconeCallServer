import { Module } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseModule } from '../../database/database.module';
import { SUPABASE_ADMIN } from '../../database/database.tokens';
import { EmergencyLeadsAdminController } from './emergency-leads-admin.controller';
import { EmergencyLeadsPublicController } from './emergency-leads.public.controller';
import { EMERGENCY_LEADS_REPO } from './emergency-leads.repository.port';
import type { EmergencyLeadsRepositoryPort } from './emergency-leads.repository.port';
import { EmergencyLeadsService } from './emergency-leads.service';
import { MemoryEmergencyLeadsRepository } from './memory-emergency-leads.repository';
import { SupabaseEmergencyLeadsRepository } from './supabase-emergency-leads.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [EmergencyLeadsPublicController, EmergencyLeadsAdminController],
  providers: [
    EmergencyLeadsService,
    {
      provide: EMERGENCY_LEADS_REPO,
      useFactory: (sb: SupabaseClient | null): EmergencyLeadsRepositoryPort =>
        sb ? new SupabaseEmergencyLeadsRepository(sb) : new MemoryEmergencyLeadsRepository(),
      inject: [SUPABASE_ADMIN],
    },
  ],
  exports: [EmergencyLeadsService],
})
export class EmergencyLeadsModule {}
