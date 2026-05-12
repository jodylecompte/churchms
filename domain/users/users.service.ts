import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { writeAuditLog } from '@/lib/audit'

const BCRYPT_COST = 12

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()))
  return user ?? null
}

export async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id))
  return user ?? null
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash)
}

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_COST)
}

export async function createUser(params: {
  email: string
  password: string
  systemRole?: string
  accountStatus?: string
  actorUserId?: string
}) {
  const passwordHash = await hashPassword(params.password)
  const [user] = await db
    .insert(users)
    .values({
      email: params.email.toLowerCase(),
      passwordHash,
      systemRole: params.systemRole ?? 'member',
      accountStatus: params.accountStatus ?? 'active',
    })
    .returning()

  await writeAuditLog({
    actorUserId: params.actorUserId ?? null,
    action: 'create',
    entityType: 'user',
    entityId: user.id,
    newValue: { email: user.email, systemRole: user.systemRole },
  })

  return user
}

export async function recordLogin(userId: string, actorUserId: string, ip?: string) {
  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId))

  await writeAuditLog({
    actorUserId,
    action: 'login',
    entityType: 'user',
    entityId: userId,
    ipAddress: ip,
  })
}

export async function countUsers(): Promise<number> {
  const result = await db.select({ id: users.id }).from(users)
  return result.length
}
