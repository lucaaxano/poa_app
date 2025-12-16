// Main entry point for @poa/database package

// Export Prisma Client singleton
export { prisma, default as prismaClient } from './client';

// Re-export all Prisma types
export * from '@prisma/client';
