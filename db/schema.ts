// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const leads = sqliteTable('leads', { id: text('id').primaryKey(), idempotencyKey: text('idempotency_key').notNull().unique(), fingerprint: text('fingerprint').notNull(), ipHash: text('ip_hash').notNull(), payload: text('payload').notNull(), createdAt: integer('created_at').notNull(), notification: text('notification').notNull().default('not_configured') });
export const limits = sqliteTable('rate_limits', { id: text('id').primaryKey(), count: integer('count').notNull() });
