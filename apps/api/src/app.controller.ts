import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  healthCheck() {
    return this.appService.healthCheck();
  }

  /**
   * Deep health check with database connectivity verification
   * Use this for monitoring and to keep API warm
   */
  @Get('health/deep')
  async deepHealthCheck() {
    return this.appService.deepHealthCheck();
  }

  /**
   * Warmup endpoint - fast response, triggers background warmup if needed
   * Call this before making critical API calls to ensure readiness
   */
  @Get('warmup')
  async warmup() {
    return this.appService.warmup();
  }
}
