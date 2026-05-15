import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/auth/session'
import { updateEmergencyContact, deleteEmergencyContact } from '@/domain/people/people.service'
import { apiError } from '@/lib/errors'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  relationship: z.string().optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  priority: z.number().int().min(1).optional(),
  notes: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ecId: string }> }
) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { ecId } = await params

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const contact = await updateEmergencyContact(session, ecId, {
      ...parsed.data,
      email: parsed.data.email || undefined,
    })
    return NextResponse.json(contact)
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; ecId: string }> }
) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { ecId } = await params
    await deleteEmergencyContact(session, ecId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error)
  }
}
