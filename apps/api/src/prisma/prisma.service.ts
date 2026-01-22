import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@poa/database';

// Connection pool configuration via DATABASE_URL query params:
// ?connection_limit=20 - Max connections in pool
// &pool_timeout=20 - Max time to wait for connection (seconds)
// &connect_timeout=10 - Max time for initial connection (seconds)

// Keep-alive interval - balanced between preventing cold connections and reducing load
// PERFORMANCE FIX: Increased from 10s to 30s to reduce database load
const KEEPALIVE_INTERVAL_MS = 30000; // 30 seconds

// Max consecutive failures before forcing reconnect
const MAX_CONSECUTIVE_FAILURES = 3;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;
  private consecutiveFailures = 0;
  private isReconnecting = false;
  private lastSuccessfulQuery = Date.now();

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();
    this.startKeepAlive();
  }

  /**
   * Connect to database with retry logic
   */
  private async connectWithRetry(maxRetries = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        await this.$connect();
        this.logger.log(
          `Database connected in ${Date.now() - startTime}ms (attempt ${attempt})`,
        );

        // Warmup - establish multiple connections in the pool
        await this.warmupConnectionPool();
        return;
      } catch (error) {
        this.logger.error(
          `Database connection attempt ${attempt}/${maxRetries} failed:`,
          error,
        );
        if (attempt === maxRetries) {
          throw error;
        }
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Warmup the connection pool with parallel queries
   * Includes table-specific queries to warm up query plans
   */
  private async warmupConnectionPool(): Promise<void> {
    try {
      const startTime = Date.now();

      // Phase 1: Basic connection warmup (5 parallel SELECT 1)
      const basicWarmup = Array(5)
        .fill(null)
        .map(() => this.$queryRaw`SELECT 1`);
      await Promise.all(basicWarmup);

      // Phase 2: Table-specific warmup to prepare query plans
      // These queries warm up the most critical paths (login, auth check)
      // Using LIMIT 0 or non-existent IDs to avoid returning data
      await Promise.all([
        // Warm up User table index (email lookup - used in login)
        this.user
          .findFirst({
            where: { email: 'warmup@nonexistent.local' },
            select: { id: true },
          })
          .catch(() => null),

        // Warm up User table with company join (used in login/auth)
        this.user
          .findFirst({
            where: { id: '00000000-0000-0000-0000-000000000000' },
            include: { company: true },
          })
          .catch(() => null),

        // Warm up Company table
        this.company
          .findFirst({
            where: { id: '00000000-0000-0000-0000-000000000000' },
          })
          .catch(() => null),
      ]);

      this.consecutiveFailures = 0;
      this.lastSuccessfulQuery = Date.now();
      this.logger.log(
        `Database warmup completed in ${Date.now() - startTime}ms (connections + query plans)`,
      );
    } catch (error) {
      this.logger.error('Database warmup failed:', error);
    }
  }

  /**
   * Start the keep-alive interval
   */
  private startKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    this.keepAliveInterval = setInterval(async () => {
      await this.performKeepAlive();
    }, KEEPALIVE_INTERVAL_MS);

    this.logger.log(
      `Database keep-alive enabled (${KEEPALIVE_INTERVAL_MS / 1000}s interval)`,
    );
  }

  /**
   * Perform keep-alive query with automatic recovery
   */
  private async performKeepAlive(): Promise<void> {
    // Skip if currently reconnecting
    if (this.isReconnecting) {
      return;
    }

    try {
      const startTime = Date.now();
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;

      // Reset failure counter on success
      this.consecutiveFailures = 0;
      this.lastSuccessfulQuery = Date.now();

      // Log warning if query was slow (>500ms)
      if (latency > 500) {
        this.logger.warn(`Keep-alive query slow: ${latency}ms`);
      }
    } catch (error) {
      this.consecutiveFailures++;
      this.logger.warn(
        `Keep-alive failed (${this.consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}):`,
        error,
      );

      // Force reconnect after too many failures
      if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        await this.forceReconnect();
      }
    }
  }

  /**
   * Force disconnect and reconnect
   */
  private async forceReconnect(): Promise<void> {
    if (this.isReconnecting) {
      return;
    }

    this.isReconnecting = true;
    this.logger.warn(
      'Forcing database reconnection due to consecutive failures...',
    );

    try {
      // Disconnect
      await this.$disconnect().catch(() => {});

      // Wait a moment for cleanup
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reconnect
      await this.connectWithRetry(3);
      this.consecutiveFailures = 0;
      this.logger.log('Database reconnection successful');
    } catch (error) {
      this.logger.error('Database reconnection failed:', error);
    } finally {
      this.isReconnecting = false;
    }
  }

  /**
   * Check if database is healthy
   * Returns latency in ms or -1 if unhealthy
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    latency: number;
    lastSuccess: number;
  }> {
    try {
      const startTime = Date.now();
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;
      this.lastSuccessfulQuery = Date.now();
      return {
        healthy: true,
        latency,
        lastSuccess: this.lastSuccessfulQuery,
      };
    } catch {
      return {
        healthy: false,
        latency: -1,
        lastSuccess: this.lastSuccessfulQuery,
      };
    }
  }

  /**
   * Execute a query with automatic retry on connection error
   * Use this for critical operations that must succeed
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 2,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        this.consecutiveFailures = 0;
        this.lastSuccessfulQuery = Date.now();
        return result;
      } catch (error) {
        lastError = error as Error;
        const errorMessage = lastError.message || '';

        // Check if it's a connection error that might benefit from retry
        const isConnectionError =
          errorMessage.includes('Connection') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('ETIMEDOUT') ||
          errorMessage.includes('socket') ||
          errorMessage.includes('closed');

        if (isConnectionError && attempt < maxRetries) {
          this.logger.warn(
            `Query failed with connection error, retrying (${attempt}/${maxRetries})...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));

          // Try to reconnect if needed
          if (attempt === maxRetries - 1) {
            await this.forceReconnect();
          }
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  async onModuleDestroy() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    await this.$disconnect();
  }
}
