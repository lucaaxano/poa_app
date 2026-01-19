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
  private lastSuccessfulQuery: number = Date.now();
  private isWarmedUp: boolean = false;
  private connectionHealthy: boolean = true;
  private reconnectInProgress: boolean = false;

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

    // Aggressive warmup - ensure multiple connections are ready
    await this.warmupConnectionPool();

    // Keep-alive every 10 seconds - very aggressive to prevent ANY cold starts
    // This is critical for preventing 504 timeouts after inactivity
    this.keepAliveInterval = setInterval(async () => {
      await this.performKeepAlive();
    }, 10000); // Every 10 seconds

    this.logger.log('Database keep-alive enabled (10s interval)');
  }

  /**
   * Warm up the connection pool aggressively
   * Creates multiple connections and validates they work
   */
  async warmupConnectionPool(): Promise<void> {
    try {
      const warmupStart = Date.now();

      // Create 5 parallel connections to warm the pool
      await Promise.all([
        this.$queryRaw`SELECT 1`,
        this.$queryRaw`SELECT 1`,
        this.$queryRaw`SELECT 1`,
        this.$queryRaw`SELECT 1`,
        this.$queryRaw`SELECT 1`,
      ]);

      // Warm PostgreSQL query cache with real table queries
      await Promise.all([
        this.user.findFirst({ take: 1 }).catch(() => null),
        this.company.findFirst({ take: 1 }).catch(() => null),
      ]);

      this.isWarmedUp = true;
      this.connectionHealthy = true;
      this.lastQueryTime = Date.now();
      this.lastSuccessfulQuery = Date.now();
      this.logger.log(`Database warmup completed in ${Date.now() - warmupStart}ms`);
    } catch (error) {
      this.logger.error('Database warmup failed:', error);
      this.connectionHealthy = false;
    }
  }

  /**
   * Perform keep-alive query with connection validation
   * If connection is unhealthy, attempt reconnection
   */
  private async performKeepAlive(): Promise<void> {
    // Skip if reconnection is already in progress
    if (this.reconnectInProgress) {
      return;
    }

    try {
      const start = Date.now();
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      this.lastQueryTime = Date.now();
      this.lastSuccessfulQuery = Date.now();
      this.connectionHealthy = true;

      // Log warning if latency is high (potential connection issue)
      if (latency > 1000) {
        this.logger.warn(`Keep-alive query slow: ${latency}ms - potential connection issue`);
      }
    } catch (error) {
      this.logger.warn('Keep-alive query failed, initiating reconnection...', error);
      this.connectionHealthy = false;
      await this.reconnect();
    }
  }

  /**
   * Reconnect to database and warm up connections
   */
  private async reconnect(): Promise<void> {
    if (this.reconnectInProgress) {
      return;
    }

    this.reconnectInProgress = true;

    try {
      this.logger.log('Attempting database reconnection...');

      // Disconnect first to clear any stale connections
      try {
        await this.$disconnect();
      } catch {
        // Ignore disconnect errors
      }

      // Wait a moment before reconnecting
      await new Promise(resolve => setTimeout(resolve, 100));

      // Reconnect
      await this.$connect();

      // Warm up connections
      await this.warmupConnectionPool();

      this.logger.log('Database reconnected and warmed up successfully');
    } catch (reconnectError) {
      this.logger.error('Reconnection failed:', reconnectError);
      this.connectionHealthy = false;
    } finally {
      this.reconnectInProgress = false;
    }
  }

  /**
   * Ensure connection is ready before critical operations
   * Call this before auth operations to prevent 504 timeouts
   */
  async ensureConnectionReady(): Promise<boolean> {
    // If connection is healthy and recent, skip check
    const timeSinceLastSuccess = Date.now() - this.lastSuccessfulQuery;
    if (this.connectionHealthy && timeSinceLastSuccess < 30000) {
      return true;
    }

    try {
      const start = Date.now();
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      this.lastSuccessfulQuery = Date.now();
      this.connectionHealthy = true;

      // If latency is very high, warn but continue
      if (latency > 500) {
        this.logger.warn(`Connection validation slow: ${latency}ms`);
      }

      return true;
    } catch (error) {
      this.logger.error('Connection validation failed:', error);
      this.connectionHealthy = false;

      // Try to reconnect
      await this.reconnect();

      return this.connectionHealthy;
    }
  }

  /**
   * Track query timing for keep-alive optimization
   */
  trackQuery(): void {
    this.lastQueryTime = Date.now();
    this.lastSuccessfulQuery = Date.now();
    this.connectionHealthy = true;
  }

  /**
   * Check if connection pool is warmed up
   */
  isConnectionWarmedUp(): boolean {
    return this.isWarmedUp;
  }

  /**
   * Check if connection is healthy
   */
  isConnectionHealthy(): boolean {
    return this.connectionHealthy;
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
   * Use this for critical operations that must not fail due to stale connections
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 100,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // On first attempt, ensure connection is ready
        if (attempt === 1) {
          await this.ensureConnectionReady();
        }

        const result = await operation();
        this.trackQuery();
        return result;
      } catch (error) {
        lastError = error as Error;
        const isConnectionError =
          error instanceof Error &&
          (error.message.includes('connection') ||
            error.message.includes('timeout') ||
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('Connection') ||
            error.message.includes('prepared statement'));

        if (isConnectionError && attempt < maxRetries) {
          this.logger.warn(
            `Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
          );

          // Mark connection as unhealthy and reconnect
          this.connectionHealthy = false;
          await this.reconnect();

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
