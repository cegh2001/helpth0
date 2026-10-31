import { Prisma, PrismaClient } from '@/generated/prisma/client';

export interface CachedPrismaClient {
  client: PrismaClient;
  /** The generated `PrismaClient` constructor this instance was built from. */
  builtFrom: typeof PrismaClient;
}

const MODEL_DELEGATES = Object.values(Prisma.ModelName).map(
  (model) => model.charAt(0).toLowerCase() + model.slice(1)
);

/**
 * In development Next.js keeps the Prisma client on `globalThis` across hot
 * reloads, so the cache can outlive the schema it was generated from. Both
 * checks are needed because they fail differently:
 *
 * - The constructor identity catches any `prisma generate`, including a new
 *   column or a changed type, which no delegate check can see. Regenerating
 *   rewrites the generated module, so reloading it yields a new class object.
 * - The delegate check catches a client bundled before the regenerate, whose
 *   model list is missing entries the current code expects.
 *
 * Expected delegates come from the generated `Prisma.ModelName` instead of a
 * hand-written list, which is what went stale when MedicalExam shipped.
 */
export function isPrismaClientCurrent(cached: CachedPrismaClient): boolean {
  if (cached.builtFrom !== PrismaClient) return false;
  return MODEL_DELEGATES.every((delegate) => delegate in cached.client);
}
