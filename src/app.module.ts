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
import { NotificationModule } from './modules/notifications/notification.module';

@Module({
  controllers: [AppController],
  imports: [
    DatabaseModule,
    AdminAuthModule,
    EmergencyLeadsModule,
    OrdersModule,
    NotificationModule,
    ServiceCatalogModule,
    TechniciansModule,
    AdminModule,
    // 정적 SPA는 API 컨트롤러 다음에 두고 /api 는 제외 (@nestjs/serve-static 샘플과 동일)
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/',
      exclude: ['/api/{*path}'],
      serveStaticOptions: {
        fallthrough: false,
      },
    }),
  ],
})
export class AppModule {}
