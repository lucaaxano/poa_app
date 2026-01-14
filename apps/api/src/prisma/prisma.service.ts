import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@poa/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;
  private lastQueryTime: number = Date.now();
  private isWarmedUp: boolean = false;

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

    // Simple warmup - just verify connection works
    await this.warmupConnectionPool();

    // Keep-alive every 60 seconds - reduced from 10s to prevent server overload
    // PostgreSQL connections stay alive for 5+ minutes by default, so 60s is plenty
    this.keepAliveInterval = setInterval(async () => {
      await this.performKeepAlive();
    }, 60000); // Every 60 seconds

    this.logger.log('Database keep-alive enabled (60s interval)');
  }

  /**
   * Warm up the connection pool - simplified to reduce server load
   * Just verifies connection works and warms up 2-3 connections
   */
  async warmupConnectionPool(): Promise<void> {
    try {
      const warmupStart = Date.now();

      // Simple warmup: just 2 parallel queries to verify connection pool
      await Promise.all([
        this.$queryRaw`SELECT 1`,
        this.$queryRaw`SELECT 1`,
      ]);

      // One real table query to warm PostgreSQL query cache
      await this.user.findFirst({ take: 1 }).catch(() => null);

      this.isWarmedUp = true;
      this.lastQueryTime = Date.now();
      this.logger.log(`Database warmup completed in ${Date.now() - warmupStart}ms`);
    } catch (error) {
      this.logger.error('Database warmup query failed:', error);
    }
  }

  /**
   * Perform keep-alive query - simplified to just one query
   * PostgreSQL connections don't need aggressive keep-alive
   */
  private async performKeepAlive(): Promise<void> {
    try {
      // Single simple query is enough to keep connection alive
      await this.$queryRaw`SELECT 1`;
      this.lastQueryTime = Date.now();
    } catch (error) {
      this.logger.warn('Keep-alive query failed, reconnecting...', error);
      try {
        await this.$disconnect();
        await this.$connect();
        await this.warmupConnectionPool();
        this.logger.log('Database reconnected and warmed up successfully');
      } catch (reconnectError) {
        this.logger.error('Reconnection failed:', reconnectError);
      }
    }
  }

  /**
   * Track query timing for keep-alive optimization
   */
  trackQuery(): void {
    this.lastQueryTime = Date.now();
  }

  /**
   * Check if connection pool is warmed up
   */
  isConnectionWarmedUp(): boolean {
    return this.isWarmedUp;
  }

  async onModuleDestroy() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    await this.$disconnect();
  }

  /**
   * Execute a query with automatic retry on connection errors
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 100,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const isConnectionError =
          error instanceof Error &&
          (error.message.includes('connection') ||
            error.message.includes('timeout') ||
            error.message.includes('ECONNREFUSED'));

        if (isConnectionError && attempt < maxRetries) {
          this.logger.warn(
            `Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }
}
