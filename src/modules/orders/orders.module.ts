import { Module } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseModule } from '../../database/database.module';
import { SUPABASE_ADMIN } from '../../database/database.tokens';
import { ServiceCatalogModule } from '../service-catalog/service-catalog.module';
import { CustomerOrdersAdminController } from './customer-orders-admin.controller';
import { MemoryOrdersRepository } from './memory-orders.repository';
import type { OrdersRepositoryPort } from './orders.repository.port';
import { ORDERS_REPO } from './orders.repository.port';
import { ExtraQuotesAdminController } from './extra-quotes-admin.controller';
import { ExtraQuotesService } from './extra-quotes.service';
import { PaymentsMockController } from './payments-mock.controller';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SupabaseOrdersRepository } from './supabase-orders.repository';

@Module({
  imports: [ServiceCatalogModule, DatabaseModule],
  controllers: [
    OrdersController,
    PaymentsMockController,
    CustomerOrdersAdminController,
    ExtraQuotesAdminController,
  ],
  providers: [
    OrdersService,
    ExtraQuotesService,
    {
      provide: ORDERS_REPO,
      useFactory: (sb: SupabaseClient | null): OrdersRepositoryPort =>
        sb ? new SupabaseOrdersRepository(sb) : new MemoryOrdersRepository(),
      inject: [SUPABASE_ADMIN],
    },
  ],
  exports: [OrdersService, ExtraQuotesService],
})
export class OrdersModule {}
