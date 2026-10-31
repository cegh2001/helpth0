import { Prisma } from '@/generated/prisma/client';

const MODEL_DELEGATES = Object.values(Prisma.ModelName).map(
  (model) => model.charAt(0).toLowerCase() + model.slice(1)
);

/**
 * In development Next.js keeps the Prisma client on `globalThis` across hot
 * reloads. A client created before the last `prisma generate` exposes only the
 * delegates that existed back then, so a model added afterwards reads as
 * `undefined` and its first query throws a TypeError. Deriving the expected
 * delegates from the generated `Prisma.ModelName` keeps this guard honest
 * without a hand-written model list that silently goes stale.
 */
export function isPrismaClientCurrent(client: object): boolean {
  return MODEL_DELEGATES.every((delegate) => delegate in client);
}
