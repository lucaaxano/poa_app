import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Basic health check - MUST verify DB connection for container health
   * Docker healthcheck uses this endpoint
   */
  @Get('health')
  async healthCheck() {
    const result = await this.appService.healthCheck();
    // If DB is not connected, return 503 so Docker knows container is unhealthy
    if (result.database?.status !== 'connected') {
      throw new HttpException(result, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return result;
  }

  /**
   * Deep health check with detailed database metrics
   * Use this for monitoring dashboards
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
