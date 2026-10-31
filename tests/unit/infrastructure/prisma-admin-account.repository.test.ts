import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@/generated/prisma/client';
import { PrismaAdminAccountRepository } from '@/infrastructure/persistence/repositories/prisma-admin-account.repository';

function createRepository(accountCount: number) {
  const userCount = vi.fn().mockResolvedValue(accountCount);
  const prisma = { user: { count: userCount } } as unknown as PrismaClient;
  return { repository: new PrismaAdminAccountRepository(prisma), userCount };
}

describe('PrismaAdminAccountRepository', () => {
  it('reports an unprovisioned instance when no account exists', async () => {
    const { repository, userCount } = createRepository(0);

    expect(await repository.isProvisioned()).toBe(false);
    expect(userCount).toHaveBeenCalledTimes(1);
  });

  it('keeps setup closed once the allowed account exists', async () => {
    const { repository } = createRepository(1);

    expect(await repository.isProvisioned()).toBe(true);
  });

  it('never reopens setup when extra accounts exist', async () => {
    const { repository } = createRepository(3);

    expect(await repository.isProvisioned()).toBe(true);
  });
});
