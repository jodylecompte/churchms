import { NextResponse } from 'next/server'
import { getSession } from '@/auth/session'

export async function GET() {
  const session = await getSession()
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }
  return NextResponse.json({
    userId: session.userId,
    email: session.email,
    systemRole: session.systemRole,
    personId: session.personId,
  })
}
