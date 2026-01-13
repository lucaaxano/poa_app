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

    // Comprehensive warmup to ensure connection pool is fully ready
    await this.warmupConnectionPool();

    // CRITICAL FIX: Keep-alive every 10 seconds to prevent cold connections
    // Also includes real table queries to keep PostgreSQL query cache warm
    this.keepAliveInterval = setInterval(async () => {
      await this.performKeepAlive();
    }, 10000); // Every 10 seconds (reduced from 30s)

    this.logger.log('Database keep-alive enabled (10s interval)');
  }

  /**
   * Warm up the connection pool with real queries
   * This ensures connections are ready for immediate use
   */
  async warmupConnectionPool(): Promise<void> {
    try {
      const warmupStart = Date.now();

      // Phase 1: Basic connection pool warmup with parallel queries
      await Promise.all([
        this.$queryRaw`SELECT 1`,
        this.$queryRaw`SELECT 1`,
        this.$queryRaw`SELECT 1`,
        this.$queryRaw`SELECT 1`,
        this.$queryRaw`SELECT 1`,
      ]);

      // Phase 2: Warm up actual table queries (keeps PostgreSQL query planner warm)
      await Promise.all([
        this.user.findFirst({ take: 1 }).catch(() => null),
        this.company.findFirst({ take: 1 }).catch(() => null),
        this.user.count().catch(() => 0),
      ]);

      // Phase 3: Pre-warm common login-related queries
      await Promise.all([
        this.$queryRaw`SELECT id, email, role FROM "User" LIMIT 1`.catch(() => null),
        this.$queryRaw`SELECT id, name FROM "Company" LIMIT 1`.catch(() => null),
      ]);

      this.isWarmedUp = true;
      this.lastQueryTime = Date.now();
      this.logger.log(`Database warmup completed in ${Date.now() - warmupStart}ms`);
    } catch (error) {
      this.logger.error('Database warmup query failed:', error);
    }
  }

  /**
   * Perform keep-alive queries to maintain connection pool
   */
  private async performKeepAlive(): Promise<void> {
    const timeSinceLastQuery = Date.now() - this.lastQueryTime;

    try {
      // Always do basic keep-alive
      await this.$queryRaw`SELECT 1`;

      // If no queries in last 15 seconds, do a more thorough warmup
      if (timeSinceLastQuery > 15000) {
        await Promise.all([
          this.$queryRaw`SELECT 1`,
          this.user.findFirst({ take: 1, select: { id: true } }).catch(() => null),
        ]);
      }

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
