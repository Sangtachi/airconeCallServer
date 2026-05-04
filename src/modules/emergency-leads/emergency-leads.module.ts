import { Module } from '@nestjs/common';
import { ServiceUnavailableException } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseModule } from '../../database/database.module';
import { SUPABASE_ADMIN } from '../../database/database.tokens';
import { OrdersModule } from '../orders/orders.module';
import { ServiceCatalogModule } from '../service-catalog/service-catalog.module';
import { EmergencyLeadDispatchBridge } from './emergency-lead-dispatch.bridge';
import { EmergencyLeadsAdminController } from './emergency-leads-admin.controller';
import { EmergencyLeadsPublicController } from './emergency-leads.public.controller';
import { EMERGENCY_LEADS_REPO } from './emergency-leads.repository.port';
import type { EmergencyLeadsRepositoryPort } from './emergency-leads.repository.port';
import { EmergencyLeadsService } from './emergency-leads.service';
import { SupabaseEmergencyLeadsRepository } from './supabase-emergency-leads.repository';

function unavailableEmergencyLeadsRepository(): EmergencyLeadsRepositoryPort {
  const fail = (): never => {
    throw new ServiceUnavailableException(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for emergency lead APIs',
    );
  };
  return {
    insert: async () => fail(),
    findById: async () => fail(),
    list: async () => fail(),
    updatePartial: async () => fail(),
  };
}

@Module({
  imports: [DatabaseModule, OrdersModule, ServiceCatalogModule],
  controllers: [EmergencyLeadsPublicController, EmergencyLeadsAdminController],
  providers: [
    EmergencyLeadDispatchBridge,
    EmergencyLeadsService,
    {
      provide: EMERGENCY_LEADS_REPO,
      useFactory: (sb: SupabaseClient | null): EmergencyLeadsRepositoryPort => {
        if (!sb) {
          return unavailableEmergencyLeadsRepository();
        }
        return new SupabaseEmergencyLeadsRepository(sb);
      },
      inject: [SUPABASE_ADMIN],
    },
  ],
  exports: [EmergencyLeadsService],
})
export class EmergencyLeadsModule {}
