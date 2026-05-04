import { Global, Module } from '@nestjs/common';
import { AdminAccessGuard } from './admin-access.guard';

@Global()
@Module({
  providers: [AdminAccessGuard],
  exports: [AdminAccessGuard],
})
export class AdminAuthModule {}
