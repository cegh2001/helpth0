import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@/generated/prisma/client';
import { getPrismaDatabaseUrl } from '../../../../prisma/database-url';
import { CachedPrismaClient, isPrismaClientCurrent } from './prisma-client-guard';

const globalForPrisma = globalThis as unknown as {
  prisma?: CachedPrismaClient;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || getPrismaDatabaseUrl();
  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

function resolvePrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && isPrismaClientCurrent(cached)) {
    return cached.client;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = { client, builtFrom: PrismaClient };
  return client;
}

export const prisma = resolvePrismaClient();
