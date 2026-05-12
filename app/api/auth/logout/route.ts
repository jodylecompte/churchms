import { NextResponse } from 'next/server'
import { getSession } from '@/auth/session'
import { writeAuditLog } from '@/lib/audit'

export async function POST() {
  const session = await getSession()
  const userId = session.userId

  session.destroy()

  if (userId) {
    await writeAuditLog({
      actorUserId: userId,
      action: 'logout',
      entityType: 'user',
      entityId: userId,
    })
  }

  return NextResponse.json({ ok: true })
}
