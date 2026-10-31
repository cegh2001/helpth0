/**
 * Provisioning state of the single local account.
 *
 * The account table belongs to the auth adapter, so the application layer only
 * asks whether the instance has been provisioned yet, never how accounts are stored.
 */
export interface AdminAccountPort {
  isProvisioned(): Promise<boolean>;
}
