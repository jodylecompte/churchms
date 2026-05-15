import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/auth/session'
import { listEmergencyContacts, createEmergencyContact } from '@/domain/people/people.service'
import { apiError } from '@/lib/errors'

const createSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().optional(),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  priority: z.number().int().min(1).optional(),
  notes: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const contacts = await listEmergencyContacts(session, id)
    return NextResponse.json(contacts)
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

    const contact = await createEmergencyContact(session, id, {
      ...parsed.data,
      email: parsed.data.email || undefined,
    })
    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
