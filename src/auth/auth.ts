import { config } from 'dotenv';
import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Logger } from '@nestjs/common';

// Loaded directly by the `@better-auth/cli` (via --config), outside Nest's
// ConfigModule — mirrors database/data-source.ts, the other file that needs
// env vars outside the Nest bootstrap.
config({ path: ['.env.local', '.env'] });

const logger = new Logger('BetterAuth');

/**
 * Better Auth has no official TypeORM adapter, so it owns its own tables
 * (user/session/account/verification) via its native Kysely/pg dialect,
 * pointed at the same Postgres database as TypeORM. Domain entities
 * reference `user.id` as a plain column — no DB-level FK across the two
 * migration systems (see documentation/AUTH-IMPLEMENTATION.md decisions).
 */
const dialect = new PostgresDialect({
  pool: new Pool({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    user: process.env.DATABASE_USER ?? 'surflivepro',
    password: process.env.DATABASE_PASSWORD ?? 'surflivepro',
    database: process.env.DATABASE_NAME ?? 'surflivepro',
  }),
});

export const auth = betterAuth({
  database: {
    db: new Kysely({ dialect }),
    type: 'postgres',
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
  basePath: '/api/auth',
  trustedOrigins: [process.env.WEB_APP_URL ?? 'http://localhost:3000'],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    // No email provider in the stack yet (MVP stub) — log the link instead
    // of sending it, per documentation/AUTH-IMPLEMENTATION.md decision #5.
    sendResetPassword: async ({ user, url }) => {
      logger.warn(`[stub] Password reset link for ${user.email}: ${url}`);
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      logger.warn(`[stub] Email verification link for ${user.email}: ${url}`);
    },
  },

  session: {
    // 30 days of inactivity; sliding renewal while active.
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },

  user: {
    additionalFields: {
      // Global platform role — distinct from Organization/Event roles,
      // which live in their own membership tables (doc §5).
      platformRole: {
        type: 'string',
        required: false,
        defaultValue: 'USER',
        input: false,
      },
    },
  },

  // Better Auth's own routes are mounted via raw Express middleware
  // (see main.ts), invisible to Nest's guard pipeline — so rate limiting
  // for them has to live here, not in @nestjs/throttler.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 60, max: 5 },
      '/forget-password': { window: 60, max: 3 },
      '/reset-password': { window: 60, max: 5 },
      '/send-verification-email': { window: 60, max: 3 },
    },
  },

  plugins: [bearer()],
});

export type AuthInstance = typeof auth;
