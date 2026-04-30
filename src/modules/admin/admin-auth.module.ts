import { Global, Module } from '@nestjs/common';
import { AdminAccessGuard } from './admin-access.guard';
import { AdminAuthService } from './admin-auth.service';

@Global()
@Module({
  providers: [AdminAuthService, AdminAccessGuard],
  exports: [AdminAuthService, AdminAccessGuard],
})
export class AdminAuthModule {}
