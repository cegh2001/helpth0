import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@/generated/prisma/client';
import { getPrismaDatabaseUrl } from '../../../../prisma/database-url';
import { isPrismaClientCurrent } from './prisma-client-guard';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || getPrismaDatabaseUrl();
  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma =
  globalForPrisma.prisma && isPrismaClientCurrent(globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : (globalForPrisma.prisma = createPrismaClient());

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
