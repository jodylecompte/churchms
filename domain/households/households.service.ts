import { eq, isNull, ilike, and } from 'drizzle-orm'
import { db } from '@/db/client'
import { households, people } from '@/db/schema'
import { writeAuditLog } from '@/lib/audit'
import type { CreateHouseholdInput, UpdateHouseholdInput } from './households.types'
import { ForbiddenError, NotFoundError } from '@/lib/errors'
import type { SessionData } from '@/auth/session'
import { hasRole } from '@/auth/rbac'

export async function listHouseholds(session: SessionData, search?: string) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()

  const conditions = [isNull(households.deletedAt)]
  if (search) {
    conditions.push(ilike(households.name, `%${search}%`))
  }

  return db
    .select()
    .from(households)
    .where(and(...conditions))
    .orderBy(households.name)
}

export async function getHouseholdById(session: SessionData, id: string) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()

  const [household] = await db
    .select()
    .from(households)
    .where(and(eq(households.id, id), isNull(households.deletedAt)))

  if (!household) throw new NotFoundError('Household not found')
  return household
}

export async function getHouseholdMembers(session: SessionData, householdId: string) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()

  return db
    .select()
    .from(people)
    .where(and(eq(people.householdId, householdId), isNull(people.deletedAt)))
    .orderBy(people.lastName, people.firstName)
}

export async function createHousehold(session: SessionData, input: CreateHouseholdInput) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()

  const [household] = await db
    .insert(households)
    .values({
      name: input.name,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      zip: input.zip,
      country: input.country ?? 'US',
      anniversaryDate: input.anniversaryDate,
      notes: input.notes,
    })
    .returning()

  await writeAuditLog({
    actorUserId: session.userId,
    action: 'create',
    entityType: 'household',
    entityId: household.id,
    newValue: { name: household.name },
  })

  return household
}

export async function updateHousehold(
  session: SessionData,
  id: string,
  input: UpdateHouseholdInput
) {
  if (!hasRole(session.systemRole, 'staff')) throw new ForbiddenError()

  const existing = await getHouseholdById(session, id)

  const [updated] = await db
    .update(households)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(households.id, id))
    .returning()

  await writeAuditLog({
    actorUserId: session.userId,
    action: 'update',
    entityType: 'household',
    entityId: id,
    oldValue: { name: existing.name },
    newValue: { name: updated.name },
  })

  return updated
}

export async function softDeleteHousehold(session: SessionData, id: string) {
  if (!hasRole(session.systemRole, 'admin')) throw new ForbiddenError()

  const existing = await getHouseholdById(session, id)

  await db.update(households).set({ deletedAt: new Date() }).where(eq(households.id, id))

  await writeAuditLog({
    actorUserId: session.userId,
    action: 'delete',
    entityType: 'household',
    entityId: id,
    oldValue: { name: existing.name },
  })
}
