import type { PrismaClient } from '@/generated/prisma/client';
import { AdminAccountPort } from '@/core/application/ports/admin-account.port';

export class PrismaAdminAccountRepository implements AdminAccountPort {
  constructor(private readonly prisma: PrismaClient) {}

  async isProvisioned(): Promise<boolean> {
    return await this.prisma.user.count() > 0;
  }
}
