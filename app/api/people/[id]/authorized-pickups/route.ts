import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/auth/session'
import { listAuthorizedPickups, createAuthorizedPickup } from '@/domain/people/people.service'
import { apiError } from '@/lib/errors'

const createSchema = z.object({
  authorizedPersonId: z.string().uuid().optional(),
  externalName: z.string().optional(),
  externalPhone: z.string().optional(),
  relationship: z.string().optional(),
  isDenied: z.boolean().optional(),
  notes: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const pickups = await listAuthorizedPickups(session, id)
    return NextResponse.json(pickups)
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const pickup = await createAuthorizedPickup(session, id, parsed.data)
    return NextResponse.json(pickup, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
