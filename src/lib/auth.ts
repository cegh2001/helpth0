import 'server-only';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@/infrastructure/persistence/prisma/prisma.client';
import {
  ALLOWED_USER_EMAIL,
  isAllowedUserEmail,
  TRUSTED_AUTH_ORIGINS,
} from '@/lib/auth-policy';

function getAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters');
  }
  return secret;
}

const sharedOptions = {
  appName: 'helpth0',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://127.0.0.1:3000',
  secret: getAuthSecret(),
  database: prismaAdapter(prisma, { provider: 'sqlite' }),
  trustedOrigins: [...TRUSTED_AUTH_ORIGINS],
  session: {
    expiresIn: 60 * 60 * 12,
    updateAge: 60 * 60,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    storage: 'memory' as const,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 60 * 60, max: 2 },
    },
  },
  advanced: {
    ipAddress: {
      disableIpTracking: true,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user: { email: string } & Record<string, unknown>) => {
          if (!isAllowedUserEmail(user.email) || await prisma.user.count() > 0) {
            return false;
          }
          return { data: { ...user, email: ALLOWED_USER_EMAIL } };
        },
      },
    },
  },
};

export const auth = betterAuth({
  ...sharedOptions,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
});

export const bootstrapAuth = betterAuth({
  ...sharedOptions,
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
});