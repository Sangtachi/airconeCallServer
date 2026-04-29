import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Redirect('/admin/index.html', 302)
  root() {
    return;
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
