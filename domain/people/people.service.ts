import { eq, isNull, ilike, or, and } from 'drizzle-orm'
import { db } from '@/db/client'
import { people, emergencyContacts, authorizedPickups, personFieldVisibility } from '@/db/schema'
import { writeAuditLog } from '@/lib/audit'
import type {
  CreatePersonInput,
  UpdatePersonInput,
  CreateEmergencyContactInput,
  UpdateEmergencyContactInput,
  CreateAuthorizedPickupInput,
  UpdateAuthorizedPickupInput,
  SetFieldVisibilityInput,
} from './people.types'
import { ForbiddenError, NotFoundError } from '@/lib/errors'
import type { SessionData } from '@/auth/session'
import { hasRole } from '@/auth/rbac'

// ── People ────────────────────────────────────────────────────────────────────

export async function listPeople(session: SessionData, search?: string, status?: string) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()

  const conditions = [isNull(people.deletedAt)]
  if (search) {
    conditions.push(
      or(
        ilike(people.firstName, `%${search}%`),
        ilike(people.lastName, `%${search}%`),
        ilike(people.email, `%${search}%`)
      )!
    )
  }
  if (status) {
    conditions.push(eq(people.churchStatus, status))
  }

  return db
    .select()
    .from(people)
    .where(and(...conditions))
    .orderBy(people.lastName, people.firstName)
}

export async function getPersonById(session: SessionData, id: string) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()

  const [person] = await db
    .select()
    .from(people)
    .where(and(eq(people.id, id), isNull(people.deletedAt)))

  if (!person) throw new NotFoundError('Person not found')
  return person
}

export async function createPerson(session: SessionData, input: CreatePersonInput) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()

  const [person] = await db
    .insert(people)
    .values({
      firstName: input.firstName,
      lastName: input.lastName,
      preferredName: input.preferredName,
      suffix: input.suffix,
      email: input.email?.toLowerCase(),
      phone: input.phone,
      phoneType: input.phoneType,
      churchStatus: input.churchStatus ?? 'visitor',
      officerTitle: input.officerTitle,
      membershipDate: input.membershipDate,
      receivedFrom: input.receivedFrom,
      isMinor: input.isMinor ?? false,
      householdId: input.householdId,
      householdRole: input.householdRole,
      birthDate: input.birthDate,
      gender: input.gender,
      maritalStatus: input.maritalStatus,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      zip: input.zip,
      allergyNotes: input.allergyNotes,
      medicalNotes: input.medicalNotes,
      internalNotes: input.internalNotes,
      baptismDate: input.baptismDate,
      baptismType: input.baptismType,
      directoryVisible: input.directoryVisible ?? true,
    })
    .returning()

  await writeAuditLog({
    actorUserId: session.userId,
    action: 'create',
    entityType: 'person',
    entityId: person.id,
    newValue: { firstName: person.firstName, lastName: person.lastName },
  })

  return person
}

export async function updatePerson(session: SessionData, id: string, input: UpdatePersonInput) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()

  const existing = await getPersonById(session, id)

  const [updated] = await db
    .update(people)
    .set({
      ...input,
      email: input.email ? input.email.toLowerCase() : input.email,
      updatedAt: new Date(),
    })
    .where(eq(people.id, id))
    .returning()

  await writeAuditLog({
    actorUserId: session.userId,
    action: 'update',
    entityType: 'person',
    entityId: id,
    oldValue: { firstName: existing.firstName, lastName: existing.lastName },
    newValue: { firstName: updated.firstName, lastName: updated.lastName },
  })

  return updated
}

export async function softDeletePerson(session: SessionData, id: string) {
  if (!hasRole(session.systemRole, 'admin')) throw new ForbiddenError()

  const existing = await getPersonById(session, id)

  await db.update(people).set({ deletedAt: new Date() }).where(eq(people.id, id))

  await writeAuditLog({
    actorUserId: session.userId,
    action: 'delete',
    entityType: 'person',
    entityId: id,
    oldValue: { firstName: existing.firstName, lastName: existing.lastName },
  })
}

export async function countPeople(): Promise<number> {
  const result = await db.select({ id: people.id }).from(people).where(isNull(people.deletedAt))
  return result.length
}

// ── Emergency Contacts ────────────────────────────────────────────────────────

export async function listEmergencyContacts(session: SessionData, personId: string) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()
  await getPersonById(session, personId)

  return db
    .select()
    .from(emergencyContacts)
    .where(eq(emergencyContacts.personId, personId))
    .orderBy(emergencyContacts.priority)
}

export async function createEmergencyContact(
  session: SessionData,
  personId: string,
  input: CreateEmergencyContactInput
) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()
  await getPersonById(session, personId)

  const [contact] = await db
    .insert(emergencyContacts)
    .values({
      personId,
      name: input.name,
      relationship: input.relationship,
      phone: input.phone,
      email: input.email,
      priority: input.priority?.toString() ?? '1',
      notes: input.notes,
    })
    .returning()

  await writeAuditLog({
    actorUserId: session.userId,
    action: 'create',
    entityType: 'emergency_contact',
    entityId: contact.id,
    newValue: { personId, name: contact.name },
  })

  return contact
}

export async function updateEmergencyContact(
  session: SessionData,
  contactId: string,
  input: UpdateEmergencyContactInput
) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()

  const [existing] = await db
    .select()
    .from(emergencyContacts)
    .where(eq(emergencyContacts.id, contactId))

  if (!existing) throw new NotFoundError('Emergency contact not found')

  const [updated] = await db
    .update(emergencyContacts)
    .set({
      ...input,
      priority: input.priority?.toString() ?? existing.priority,
    })
    .where(eq(emergencyContacts.id, contactId))
    .returning()

  await writeAuditLog({
    actorUserId: session.userId,
    action: 'update',
    entityType: 'emergency_contact',
    entityId: contactId,
    oldValue: { name: existing.name },
    newValue: { name: updated.name },
  })

  return updated
}

export async function deleteEmergencyContact(session: SessionData, contactId: string) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()

  const [existing] = await db
    .select()
    .from(emergencyContacts)
    .where(eq(emergencyContacts.id, contactId))

  if (!existing) throw new NotFoundError('Emergency contact not found')

  await db.delete(emergencyContacts).where(eq(emergencyContacts.id, contactId))

  await writeAuditLog({
    actorUserId: session.userId,
    action: 'delete',
    entityType: 'emergency_contact',
    entityId: contactId,
    oldValue: { name: existing.name },
  })
}

// ── Authorized Pickups ────────────────────────────────────────────────────────

export async function listAuthorizedPickups(session: SessionData, childPersonId: string) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()
  await getPersonById(session, childPersonId)

  return db
    .select()
    .from(authorizedPickups)
    .where(eq(authorizedPickups.childPersonId, childPersonId))
    .orderBy(authorizedPickups.createdAt)
}

export async function createAuthorizedPickup(
  session: SessionData,
  childPersonId: string,
  input: CreateAuthorizedPickupInput
) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()
  await getPersonById(session, childPersonId)

  if (!input.authorizedPersonId && !input.externalName) {
    throw new Error('Must provide either an authorized person or an external name')
  }

  const [pickup] = await db
    .insert(authorizedPickups)
    .values({
      childPersonId,
      authorizedPersonId: input.authorizedPersonId,
      externalName: input.externalName,
      externalPhone: input.externalPhone,
      relationship: input.relationship,
      isDenied: input.isDenied ?? false,
      notes: input.notes,
      createdByUserId: session.userId,
    })
    .returning()

  await writeAuditLog({
    actorUserId: session.userId,
    action: 'create',
    entityType: 'authorized_pickup',
    entityId: pickup.id,
    newValue: { childPersonId, isDenied: pickup.isDenied },
  })

  return pickup
}

export async function updateAuthorizedPickup(
  session: SessionData,
  pickupId: string,
  input: UpdateAuthorizedPickupInput
) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()

  const [existing] = await db
    .select()
    .from(authorizedPickups)
    .where(eq(authorizedPickups.id, pickupId))

  if (!existing) throw new NotFoundError('Authorized pickup not found')

  const [updated] = await db
    .update(authorizedPickups)
    .set(input)
    .where(eq(authorizedPickups.id, pickupId))
    .returning()

  await writeAuditLog({
    actorUserId: session.userId,
    action: 'update',
    entityType: 'authorized_pickup',
    entityId: pickupId,
    oldValue: { isDenied: existing.isDenied },
    newValue: { isDenied: updated.isDenied },
  })

  return updated
}

// ── Field Visibility ──────────────────────────────────────────────────────────

export const VISIBILITY_FIELDS = ['email', 'phone', 'address', 'birthDate'] as const
export type VisibilityFieldName = (typeof VISIBILITY_FIELDS)[number]

const VISIBILITY_DEFAULTS: Record<VisibilityFieldName, string> = {
  email: 'public',
  phone: 'public',
  address: 'public',
  birthDate: 'staff_only',
}

export async function getPersonFieldVisibility(session: SessionData, personId: string) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()
  await getPersonById(session, personId)

  const rows = await db
    .select()
    .from(personFieldVisibility)
    .where(eq(personFieldVisibility.personId, personId))

  const result = { ...VISIBILITY_DEFAULTS }
  for (const row of rows) {
    if (row.fieldName in result) {
      result[row.fieldName as VisibilityFieldName] = row.visibility
    }
  }
  return result
}

export async function setPersonFieldVisibility(
  session: SessionData,
  personId: string,
  input: SetFieldVisibilityInput
) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()
  await getPersonById(session, personId)

  await db
    .insert(personFieldVisibility)
    .values({ personId, fieldName: input.fieldName, visibility: input.visibility })
    .onConflictDoUpdate({
      target: [personFieldVisibility.personId, personFieldVisibility.fieldName],
      set: { visibility: input.visibility },
    })

  await writeAuditLog({
    actorUserId: session.userId,
    action: 'update',
    entityType: 'person_field_visibility',
    entityId: personId,
    newValue: { fieldName: input.fieldName, visibility: input.visibility },
  })
}

export async function deleteAuthorizedPickup(session: SessionData, pickupId: string) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()

  const [existing] = await db
    .select()
    .from(authorizedPickups)
    .where(eq(authorizedPickups.id, pickupId))

  if (!existing) throw new NotFoundError('Authorized pickup not found')

  await db.delete(authorizedPickups).where(eq(authorizedPickups.id, pickupId))

  await writeAuditLog({
    actorUserId: session.userId,
    action: 'delete',
    entityType: 'authorized_pickup',
    entityId: pickupId,
    oldValue: { childPersonId: existing.childPersonId },
  })
}
