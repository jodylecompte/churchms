import { pgTable, text, uuid, date, timestamp } from 'drizzle-orm/pg-core'

export const households = pgTable('households', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  country: text('country').default('US'),
  anniversaryDate: date('anniversary_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
})

export type Household = typeof households.$inferSelect
export type NewHousehold = typeof households.$inferInsert
