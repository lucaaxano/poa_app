import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@poa/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

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

    // Warmup query to ensure connection pool is ready
    try {
      const warmupStart = Date.now();
      await this.$queryRaw`SELECT 1`;
      this.logger.log(`Database warmup query took ${Date.now() - warmupStart}ms`);
    } catch (error) {
      this.logger.error('Database warmup query failed:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
