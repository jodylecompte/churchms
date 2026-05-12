import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/auth/session'
import { getPersonById, updatePerson, softDeletePerson } from '@/domain/people/people.service'
import { apiError } from '@/lib/errors'

const updatePersonSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  preferredName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  phoneType: z.enum(['mobile', 'home', 'work']).optional(),
  churchStatus: z.enum(['visitor', 'member', 'officer']).optional(),
  officerTitle: z.string().optional(),
  isMinor: z.boolean().optional(),
  directoryVisible: z.boolean().optional(),
  householdId: z.string().uuid().optional(),
  householdRole: z.enum(['head', 'spouse', 'child', 'other']).optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  allergyNotes: z.string().optional(),
  medicalNotes: z.string().optional(),
  internalNotes: z.string().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const person = await getPersonById(session, id)
    return NextResponse.json(person)
  } catch (error) {
    return apiError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await request.json()
    const parsed = updatePersonSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const person = await updatePerson(session, id, parsed.data)
    return NextResponse.json(person)
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    await softDeletePerson(session, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error)
  }
}
