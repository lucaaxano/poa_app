import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';
import compression from 'compression';

// Global request timeout - respond BEFORE reverse proxy times out
// Coolify/Caddy default is ~30s, so we use 25s to ensure we respond first
const REQUEST_TIMEOUT_MS = 25000;

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    // Enable raw body for Stripe webhooks
    rawBody: true,
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const expressApp = app.getHttpAdapter().getInstance();

  // ===========================================
  // CORS Configuration - MUST BE FIRST MIDDLEWARE
  // ===========================================
  // This ensures CORS headers are set for ALL responses including errors/timeouts
  const frontendUrl = configService.get('FRONTEND_URL') || 'https://poa-platform.de';
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://poa-platform.de',
    'https://www.poa-platform.de',
    frontendUrl,
    frontendUrl?.replace(/\/$/, ''),
    frontendUrl?.replace('https://', 'https://www.'),
  ].filter(Boolean) as string[];

  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

  // Helper function to set CORS headers
  const setCorsHeaders = (req: Request, res: Response) => {
    const origin = req.headers.origin;

    if (origin) {
      const normalizedOrigin = origin.replace(/\/$/, '');
      const isAllowed = allowedOrigins.some(allowed => {
        const normalizedAllowed = allowed.replace(/\/$/, '');
        return normalizedOrigin === normalizedAllowed;
      });

      if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
        res.setHeader('Access-Control-Max-Age', '86400');
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  };

  // CORS middleware - FIRST to handle preflight immediately
  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    setCorsHeaders(req, res);

    // Handle preflight OPTIONS requests immediately - no further processing needed
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  });

  // ===========================================
  // Response Compression - reduces transfer size by 60-80%
  // ===========================================
  expressApp.use(compression({
    threshold: 1024, // Only compress responses > 1KB
    level: 6,        // Standard compression level
  }));

  // ===========================================
  // CRITICAL: Global Request Timeout Middleware
  // ===========================================
  // This ensures ALL requests have a timeout to prevent 504 Gateway Timeout
  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    // Skip timeout for health checks (needed for Docker healthcheck)
    if (req.path === '/api/health' || req.path === '/api/health/deep') {
      return next();
    }

    // Set response timeout
    res.setTimeout(REQUEST_TIMEOUT_MS, () => {
      if (!res.headersSent) {
        logger.warn(`Request timeout after ${REQUEST_TIMEOUT_MS}ms: ${req.method} ${req.path}`);
        // CORS headers already set by first middleware
        res.status(503).json({
          statusCode: 503,
          message: 'Server ist überlastet. Bitte versuchen Sie es erneut.',
          error: 'Service Unavailable',
          timeout: true,
        });
      }
    });

    next();
  });

  // ===========================================
  // SLOW REQUEST LOGGING MIDDLEWARE
  // ===========================================
  // Log requests that take longer than 3 seconds to help diagnose timeout issues
  // Uses res.locals instead of a Map to avoid memory leaks if 'finish' event doesn't fire
  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    res.locals._startTime = Date.now();

    res.on('finish', () => {
      const startTime = res.locals._startTime as number | undefined;
      if (startTime) {
        const duration = Date.now() - startTime;
        if (duration > 3000) {
          logger.warn(`[SLOW_REQUEST] ${req.method} ${req.path} took ${duration}ms - Status: ${res.statusCode}`);
        }
      }
    });

    next();
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 4000;
  await app.listen(port);

  // Enable graceful shutdown hooks (triggers onModuleDestroy in PrismaService etc.)
  app.enableShutdownHooks();

  // Handle SIGTERM/SIGINT for clean container shutdown
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}, starting graceful shutdown...`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.log(`POA API is running on: http://localhost:${port}`);
  logger.log(`Health check: http://localhost:${port}/api/health`);
}

bootstrap();
