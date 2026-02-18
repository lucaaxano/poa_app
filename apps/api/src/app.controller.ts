import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Liveness probe - ALWAYS returns 200
   * Traefik uses this to decide if the API should stay in the load balancer.
   * No DB check — a short DB glitch must NOT cause Traefik to evict the API.
   */
  @Get('ping')
  ping() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  /**
   * Readiness / health check - verifies DB connection with grace period
   * Docker healthcheck uses this endpoint (container restart on prolonged DB outage)
   */
  @Get('health')
  async healthCheck() {
    const result = await this.appService.healthCheck();
    if (result.status === 'unhealthy') {
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
