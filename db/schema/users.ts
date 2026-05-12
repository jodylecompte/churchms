import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core'
import { people } from './people'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id').references(() => people.id),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  systemRole: text('system_role').notNull().default('member'),
  accountStatus: text('account_status').notNull().default('invited'),
  invitationToken: text('invitation_token').unique(),
  invitationExpiresAt: timestamp('invitation_expires_at', { withTimezone: true, mode: 'date' }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
