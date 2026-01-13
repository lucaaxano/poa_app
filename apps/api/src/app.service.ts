import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Health check that verifies DB connection
   * Used by Docker healthcheck - MUST return DB status
   */
  async healthCheck() {
    let dbStatus = 'disconnected';
    let dbLatency = 0;

    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
      dbStatus = 'connected';
      this.prisma.trackQuery();
    } catch (error) {
      this.logger.error('Health check DB query failed:', error);
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'POA API',
      version: '0.0.1',
      database: {
        status: dbStatus,
        latency: dbLatency,
      },
    };
  }

  /**
   * Deep health check that also warms up the database connection
   * This endpoint should be called by monitoring/frontend to keep API warm
   */
  async deepHealthCheck() {
    const startTime = Date.now();
    let dbStatus = 'unknown';
    let dbLatency = 0;

    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
      dbStatus = 'connected';

      // Track query to help keep-alive optimization
      this.prisma.trackQuery();
    } catch (error) {
      dbStatus = 'error';
      this.logger.warn('Database health check failed:', error);
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'POA API',
      version: '0.0.1',
      latency: Date.now() - startTime,
      database: {
        status: dbStatus,
        latency: dbLatency,
        warmedUp: this.prisma.isConnectionWarmedUp(),
      },
    };
  }

  /**
   * Warmup endpoint - called to ensure API and DB are ready
   * Returns quickly but triggers background warmup if needed
   */
  async warmup() {
    const startTime = Date.now();

    // Quick ping to verify basic connectivity
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.prisma.trackQuery();
    } catch (error) {
      this.logger.error('Warmup ping failed:', error);
      // Try to reconnect in background
      this.prisma.warmupConnectionPool().catch(() => {});
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      latency: Date.now() - startTime,
      warmedUp: this.prisma.isConnectionWarmedUp(),
    };
  }
}
