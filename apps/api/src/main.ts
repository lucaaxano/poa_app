import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';

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

  // ===========================================
  // CRITICAL: Global Request Timeout Middleware
  // ===========================================
  // This MUST be the first middleware to ensure ALL requests have a timeout
  // Without this, slow DB queries or bcrypt can cause 504 Gateway Timeout
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    // Skip timeout for health checks (needed for Docker healthcheck)
    if (req.path === '/api/health' || req.path === '/api/health/deep') {
      return next();
    }

    // Set response timeout
    res.setTimeout(REQUEST_TIMEOUT_MS, () => {
      if (!res.headersSent) {
        logger.warn(`Request timeout after ${REQUEST_TIMEOUT_MS}ms: ${req.method} ${req.path}`);
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
  const requestTimings = new Map<Response, number>();

  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    requestTimings.set(res, Date.now());

    res.on('finish', () => {
      const startTime = requestTimings.get(res);
      requestTimings.delete(res);
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

  // CORS Configuration - More permissive and robust
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

  // CORS headers middleware - after timeout middleware
  // This ensures CORS headers are set even if the request times out or errors
  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    // Set CORS headers for ALL responses (including errors/timeouts)
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
        res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
      }
    } else {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    // Handle preflight OPTIONS requests immediately
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  });

  // Still enable NestJS CORS for proper integration
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const normalizedOrigin = origin.replace(/\/$/, '');
      const isAllowed = allowedOrigins.some(allowed => {
        const normalizedAllowed = allowed.replace(/\/$/, '');
        return normalizedOrigin === normalizedAllowed;
      });
      if (isAllowed) {
        return callback(null, origin);
      }
      logger.warn(`CORS blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // Cache preflight for 24 hours
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 4000;
  await app.listen(port);

  logger.log(`POA API is running on: http://localhost:${port}`);
  logger.log(`Health check: http://localhost:${port}/api/health`);
}

bootstrap();
