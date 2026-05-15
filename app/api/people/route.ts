import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/auth/session'
import { listPeople, createPerson } from '@/domain/people/people.service'
import { apiError } from '@/lib/errors'

const createPersonSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  preferredName: z.string().optional(),
  suffix: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  phoneType: z.enum(['mobile', 'home', 'work']).optional(),
  churchStatus: z.enum(['visitor', 'member', 'officer']).optional(),
  officerTitle: z.string().optional(),
  membershipDate: z.string().optional(),
  receivedFrom: z.string().optional(),
  isMinor: z.boolean().optional(),
  householdId: z.string().uuid().optional(),
  householdRole: z.enum(['head', 'spouse', 'child', 'other']).optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  allergyNotes: z.string().optional(),
  medicalNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  baptismDate: z.string().optional(),
  baptismType: z.string().optional(),
  directoryVisible: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const search = request.nextUrl.searchParams.get('search') ?? undefined
    const status = request.nextUrl.searchParams.get('status') ?? undefined
    const persons = await listPeople(session, search, status)
    return NextResponse.json(persons)
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = createPersonSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const person = await createPerson(session, {
      ...parsed.data,
      email: parsed.data.email || undefined,
    })
    return NextResponse.json(person, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
