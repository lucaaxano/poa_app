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

// Keep-alive interval - balance between connection freshness and server load
// 45s interval coordinates with Docker healthcheck (also 45s) for ~1 ping every 22s
// Stays within PostgreSQL tcp_keepalives_idle of 30s
const KEEPALIVE_INTERVAL_MS = 45000; // 45 seconds

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
    try {
      await this.connectWithRetry();
    } catch (error) {
      this.logger.error(
        'CRITICAL: Database connection failed at startup. ' +
        'App will start WITHOUT database connectivity. ' +
        'Keep-alive will attempt reconnection.',
        error,
      );
    }
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
   * Warmup the connection pool with queries
   * Phase 1: parallel connection warmup (reduced to 3 to limit pool usage)
   * Phase 2: sequential table warmups (reuses already-opened connections)
   */
  private async warmupConnectionPool(): Promise<void> {
    try {
      const startTime = Date.now();

      // Phase 1: Basic connection warmup (3 parallel SELECT 1)
      // Reduced from 5 to limit pool usage to ~15% instead of ~40%
      const basicWarmup = Array(3)
        .fill(null)
        .map(() => this.$queryRaw`SELECT 1`);
      await Promise.all(basicWarmup);

      // Phase 2: Table-specific warmup to prepare query plans
      // Run sequentially to reuse already-opened connections from Phase 1
      // Using non-existent IDs to return quickly but still warm up query plans
      await this.user
        .findFirst({
          where: { email: 'warmup@nonexistent.local' },
          select: { id: true },
        })
        .catch(() => null);

      await this.user
        .findFirst({
          where: { id: '00000000-0000-0000-0000-000000000000' },
          include: { company: true },
        })
        .catch(() => null);

      await this.company
        .findFirst({
          where: { id: '00000000-0000-0000-0000-000000000000' },
        })
        .catch(() => null);

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

  /**
   * Execute a database operation with a timeout.
   * Prevents single slow queries from blocking the connection pool.
   * Use for critical endpoints like dashboard aggregations and list queries.
   */
  async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs = 10000,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(`Query timed out after ${timeoutMs}ms`),
        );
      }, timeoutMs);

      operation()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  async onModuleDestroy() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    await this.$disconnect();
  }
}
