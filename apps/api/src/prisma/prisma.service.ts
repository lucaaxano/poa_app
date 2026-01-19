import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@poa/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit() {
    const startTime = Date.now();
    await this.$connect();
    this.logger.log(`Database connected in ${Date.now() - startTime}ms`);

    // Simple warmup - just 2 queries to verify connection
    try {
      await Promise.all([
        this.$queryRaw`SELECT 1`,
        this.$queryRaw`SELECT 1`,
      ]);
      this.logger.log('Database warmup completed');
    } catch (error) {
      this.logger.error('Database warmup failed:', error);
    }

    // Keep-alive every 30 seconds - simple and reliable
    this.keepAliveInterval = setInterval(async () => {
      try {
        await this.$queryRaw`SELECT 1`;
      } catch (error) {
        this.logger.warn('Keep-alive query failed:', error);
      }
    }, 30000);

    this.logger.log('Database keep-alive enabled (30s interval)');
  }

  async onModuleDestroy() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    await this.$disconnect();
  }
}
