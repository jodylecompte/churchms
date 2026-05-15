import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/auth/session'
import {
  getPersonFieldVisibility,
  setPersonFieldVisibility,
  VISIBILITY_FIELDS,
} from '@/domain/people/people.service'
import { ForbiddenError, NotFoundError } from '@/lib/errors'

const patchSchema = z.object({
  fieldName: z.enum(VISIBILITY_FIELDS),
  visibility: z.enum(['public', 'staff_only', 'self_only']),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const { id } = await params
  try {
    const data = await getPersonFieldVisibility(session, id)
    return NextResponse.json(data)
  } catch (e) {
    if (e instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (e instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const { id } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    await setPersonFieldVisibility(session, id, parsed.data)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (e instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
