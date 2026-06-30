import { sql } from 'drizzle-orm';
import { index, smallint, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { vtSaasSchema } from './_db-schema';

// Stores encrypted third-party OAuth credentials, one row per (user, provider).
// `provider` is free-text (single-provider today, extensible to many).
export const platformConnections = vtSaasSchema.table(
  'platform_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    provider: text('provider').notNull(),
    accessToken: text('access_token').notNull(), // stored AES-256-GCM encrypted
    // Which TOKEN_ENCRYPTION_KEY version encrypted access_token/refresh_token.
    // Lets the decrypt path branch on key version during a future key rotation.
    encryptionKeyVersion: smallint('encryption_key_version').notNull().default(1),
    refreshToken: text('refresh_token'), // nullable — not all providers issue refresh tokens
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    providerAccountId: text('provider_account_id').notNull(), // stable provider account id (OIDC `sub`)
    username: text('username').notNull(), // provider display name / handle
    displayName: text('display_name'), // human-readable name (e.g. "Jane Smith")
    profilePictureUrl: text('profile_picture_url'),
    scope: text('scope'), // OAuth scopes granted on the connection
    status: text('status').notNull().default('connected'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    userIdIdx: index('idx_platform_connections_user_id').on(table.userId),
    userProviderUnique: unique('uq_platform_connections_user_provider').on(table.userId, table.provider),
    // Backs a future every-N-min token-refresh cron:
    // `SELECT … WHERE token_expires_at > NOW() AND … < NOW() + interval`.
    tokenExpiresAtIdx: index('idx_platform_connections_token_expires_at')
      .on(table.tokenExpiresAt)
      .where(sql`token_expires_at IS NOT NULL`),
  }),
);

export type PlatformConnectionRow = typeof platformConnections.$inferSelect;
export type InsertPlatformConnection = typeof platformConnections.$inferInsert;
