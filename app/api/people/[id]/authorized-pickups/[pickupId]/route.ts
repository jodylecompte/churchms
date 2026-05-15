import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/auth/session'
import { updateAuthorizedPickup, deleteAuthorizedPickup } from '@/domain/people/people.service'
import { apiError } from '@/lib/errors'

const updateSchema = z.object({
  externalName: z.string().optional(),
  externalPhone: z.string().optional(),
  relationship: z.string().optional(),
  isDenied: z.boolean().optional(),
  notes: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pickupId: string }> }
) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { pickupId } = await params

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const pickup = await updateAuthorizedPickup(session, pickupId, parsed.data)
    return NextResponse.json(pickup)
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pickupId: string }> }
) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { pickupId } = await params
    await deleteAuthorizedPickup(session, pickupId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error)
  }
}
