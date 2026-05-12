import { eq, isNull, ilike, or, and } from 'drizzle-orm'
import { db } from '@/db/client'
import { people } from '@/db/schema'
import { writeAuditLog } from '@/lib/audit'
import type { CreatePersonInput, UpdatePersonInput } from './people.types'
import { ForbiddenError, NotFoundError } from '@/lib/errors'
import type { SessionData } from '@/auth/session'
import { hasRole } from '@/auth/rbac'

export async function listPeople(session: SessionData, search?: string) {
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
      email: input.email?.toLowerCase(),
      phone: input.phone,
      phoneType: input.phoneType,
      churchStatus: input.churchStatus ?? 'visitor',
      isMinor: input.isMinor ?? false,
      householdId: input.householdId,
      householdRole: input.householdRole,
      birthDate: input.birthDate,
      gender: input.gender,
      allergyNotes: input.allergyNotes,
      medicalNotes: input.medicalNotes,
      internalNotes: input.internalNotes,
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
      email: input.email ? input.email.toLowerCase() : undefined,
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
