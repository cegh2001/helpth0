import { AdminAccountPort } from '@/core/application/ports/admin-account.port';

export class CheckSetupStatusUseCase {
  constructor(private readonly adminAccount: AdminAccountPort) {}

  async execute(): Promise<boolean> {
    return this.adminAccount.isProvisioned();
  }
}
