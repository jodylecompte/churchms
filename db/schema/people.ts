import { pgTable, text, uuid, boolean, date, timestamp } from 'drizzle-orm/pg-core'
import { households } from './households'

export const people = pgTable('people', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').references(() => households.id),
  householdRole: text('household_role'),

  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  preferredName: text('preferred_name'),
  suffix: text('suffix'),

  churchStatus: text('church_status').notNull().default('visitor'),
  officerTitle: text('officer_title'),
  membershipDate: date('membership_date'),
  receivedFrom: text('received_from'),

  email: text('email'),
  phone: text('phone'),
  phoneType: text('phone_type'),

  birthDate: date('birth_date'),
  isMinor: boolean('is_minor').notNull().default(false),
  gender: text('gender'),
  maritalStatus: text('marital_status'),

  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),

  allergyNotes: text('allergy_notes'),
  medicalNotes: text('medical_notes'),
  internalNotes: text('internal_notes'),
  baptismDate: date('baptism_date'),
  baptismType: text('baptism_type'),

  profilePhotoKey: text('profile_photo_key'),
  directoryVisible: boolean('directory_visible').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
})

export const personFieldVisibility = pgTable('person_field_visibility', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id').notNull().references(() => people.id),
  fieldName: text('field_name').notNull(),
  visibility: text('visibility').notNull(),
})

export const emergencyContacts = pgTable('emergency_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id').notNull().references(() => people.id),
  name: text('name').notNull(),
  relationship: text('relationship'),
  phone: text('phone').notNull(),
  email: text('email'),
  priority: text('priority').notNull().default('1'),
  notes: text('notes'),
})

export type Person = typeof people.$inferSelect
export type NewPerson = typeof people.$inferInsert
