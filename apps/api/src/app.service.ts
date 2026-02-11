import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { StorageService } from './storage/storage.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Health check that verifies DB connection
   * Used by Docker healthcheck - MUST return DB status
   */
  async healthCheck() {
    let dbStatus: string = this.prisma.connected ? 'connected' : 'connecting';
    let dbLatency = 0;

    if (this.prisma.connected) {
      try {
        const start = Date.now();
        await this.prisma.$queryRaw`SELECT 1`;
        dbLatency = Date.now() - start;
        dbStatus = 'connected';
      } catch (error) {
        this.logger.error('Health check DB query failed:', error);
        dbStatus = 'error';
      }
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      service: 'POA API',
      version: '0.0.1',
      database: {
        status: dbStatus,
        latency: dbLatency,
      },
    };
  }

  /**
   * Deep health check - same as health check but with more info
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
    } catch (error) {
      dbStatus = 'error';
      this.logger.warn('Database health check failed:', error);
    }

    const storageHealth = await this.storageService.healthCheck();

    const allHealthy = dbStatus === 'connected' && storageHealth.status === 'connected';

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'POA API',
      version: '0.0.1',
      latency: Date.now() - startTime,
      database: {
        status: dbStatus,
        latency: dbLatency,
      },
      storage: storageHealth,
    };
  }

  /**
   * Warmup endpoint - verifies API is ready and warms up critical query paths
   */
  async warmup() {
    const startTime = Date.now();

    try {
      // Primary DB connection check
      await this.prisma.$queryRaw`SELECT 1`;

      // Warm up critical model query paths
      // These queries use non-existent UUIDs so they return quickly but still
      // warm up the Prisma query engine and connection pool for these models
      await Promise.all([
        this.prisma.user.findFirst({
          where: { id: '00000000-0000-0000-0000-000000000000' },
          select: { id: true },
        }),
        this.prisma.company.findFirst({
          where: { id: '00000000-0000-0000-0000-000000000000' },
          select: { id: true },
        }),
      ]).catch(() => {
        // Silent failure - these are just warmup queries
      });

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        latency: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Warmup ping failed:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        latency: Date.now() - startTime,
      };
    }
  }
}
