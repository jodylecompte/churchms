import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db/client'
import { appSettings } from '@/db/schema'
import { writeAuditLog } from '@/lib/audit'
import { requireRole } from '@/auth/rbac'
import type { SessionData } from '@/auth/session'

const KNOWN_KEYS = [
  'church_name',
  'church_email',
  'church_phone',
  'church_website',
  'giving_url',
] as const

export type SettingKey = (typeof KNOWN_KEYS)[number]

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(appSettings).where(inArray(appSettings.key, [...KNOWN_KEYS]))
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key))
  return row?.value ?? null
}

export async function setSetting(
  session: SessionData,
  key: string,
  value: string
): Promise<void> {
  requireRole(session, 'admin')

  await db
    .insert(appSettings)
    .values({ key, value, updatedByUserId: session.userId })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date(), updatedByUserId: session.userId },
    })

  await writeAuditLog({
    actorUserId: session.userId,
    action: 'update',
    entityType: 'app_setting',
    entityId: null,
    newValue: { key, value },
  })
}

export async function setSettings(
  session: SessionData,
  settings: Partial<Record<string, string>>
): Promise<void> {
  requireRole(session, 'admin')

  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined) {
      await setSetting(session, key, value)
    }
  }
}
