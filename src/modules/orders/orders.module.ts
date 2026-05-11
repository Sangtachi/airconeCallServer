import { Module } from '@nestjs/common';
import { ServiceUnavailableException } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseModule } from '../../database/database.module';
import { SUPABASE_ADMIN } from '../../database/database.tokens';
import { ServiceCatalogModule } from '../service-catalog/service-catalog.module';
import { NotificationModule } from '../notifications/notification.module';
import { CustomerOrdersAdminController } from './customer-orders-admin.controller';
import type { OrdersRepositoryPort } from './orders.repository.port';
import { ORDERS_REPO } from './orders.repository.port';
import { ExtraQuotesAdminController } from './extra-quotes-admin.controller';
import { ExtraQuotesService } from './extra-quotes.service';
import { PaymentsMockController } from './payments-mock.controller';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SupabaseOrdersRepository } from './supabase-orders.repository';

function unavailableOrdersRepository(): OrdersRepositoryPort {
  const fail = (): never => {
    throw new ServiceUnavailableException(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for order APIs',
    );
  };
  return {
    insert: async () => fail(),
    replace: async () => fail(),
    findById: async () => fail(),
    listNewestFirst: async () => fail(),
    appendMockProductPayment: async () => fail(),
  };
}

@Module({
  imports: [ServiceCatalogModule, DatabaseModule, NotificationModule],
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
      useFactory: (sb: SupabaseClient | null): OrdersRepositoryPort => {
        if (!sb) {
          return unavailableOrdersRepository();
        }
        return new SupabaseOrdersRepository(sb);
      },
      inject: [SUPABASE_ADMIN],
    },
  ],
  exports: [OrdersService, ExtraQuotesService],
})
export class OrdersModule {}
