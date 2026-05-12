import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/auth/session'
import { findUserByEmail, verifyPassword, recordLogin } from '@/domain/users/users.service'
import { checkRateLimit } from '@/lib/rate-limit'
import { runStartup } from '@/lib/startup'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  await runStartup()

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const { allowed } = checkRateLimit(`login:${ip}`)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { email, password } = parsed.data

  const user = await findUserByEmail(email)
  if (!user || user.accountStatus !== 'active') {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const session = await getSession()
  session.userId = user.id
  session.systemRole = user.systemRole as 'super_admin' | 'admin' | 'staff' | 'member'
  session.personId = user.personId ?? null
  session.email = user.email
  await session.save()

  await recordLogin(user.id, user.id, ip)

  return NextResponse.json({ ok: true })
}
