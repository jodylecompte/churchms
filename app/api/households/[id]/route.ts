import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/auth/session'
import {
  getHouseholdById,
  getHouseholdMembers,
  updateHousehold,
  softDeleteHousehold,
} from '@/domain/households/households.service'
import { apiError } from '@/lib/errors'

const updateHouseholdSchema = z.object({
  name: z.string().min(1).optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  anniversaryDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    const [household, members] = await Promise.all([
      getHouseholdById(session, id),
      getHouseholdMembers(session, id),
    ])
    return NextResponse.json({ ...household, members })
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
    const parsed = updateHouseholdSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const household = await updateHousehold(session, id, parsed.data)
    return NextResponse.json(household)
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    await softDeleteHousehold(session, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error)
  }
}
