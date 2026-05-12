import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core'

export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedByUserId: uuid('updated_by_user_id'),
})

export type AppSetting = typeof appSettings.$inferSelect
