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
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      pid: process.pid,
    };
  }

  @Get('metrics')
  metrics() {
    const m = process.memoryUsage();
    return {
      uptimeSeconds: Math.round(process.uptime()),
      rssBytes: m.rss,
      heapUsedBytes: m.heapUsed,
      heapTotalBytes: m.heapTotal,
      date: new Date().toISOString(),
    };
  }
}
