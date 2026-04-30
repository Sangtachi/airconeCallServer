import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { DatabaseModule } from './database/database.module';
import { AdminAuthModule } from './modules/admin/admin-auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { AppController } from './app.controller';
import { EmergencyLeadsModule } from './modules/emergency-leads/emergency-leads.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ServiceCatalogModule } from './modules/service-catalog/service-catalog.module';
import { TechniciansModule } from './modules/technicians/technicians.module';

@Module({
  controllers: [AppController],
  imports: [
    DatabaseModule,
    AdminAuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/',
    }),
    EmergencyLeadsModule,
    OrdersModule,
    ServiceCatalogModule,
    TechniciansModule,
    AdminModule,
  ],
})
export class AppModule {}
