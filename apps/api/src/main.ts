import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Enable raw body for Stripe webhooks
    rawBody: true,
  });

  const configService = app.get(ConfigService);

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

  // CORS - Allow all origins in production for now to debug
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

  console.log('CORS allowed origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Normalize origin (remove trailing slash)
      const normalizedOrigin = origin.replace(/\/$/, '');

      // Check if origin is in allowed list
      const isAllowed = allowedOrigins.some(allowed => {
        const normalizedAllowed = allowed.replace(/\/$/, '');
        return normalizedOrigin === normalizedAllowed;
      });

      if (isAllowed) {
        return callback(null, origin);
      }

      console.warn(`CORS blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 4000;
  await app.listen(port);

  console.log(`POA API is running on: http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
}

bootstrap();
