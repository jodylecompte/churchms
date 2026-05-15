import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/auth/session'
import { listHouseholds, createHousehold } from '@/domain/households/households.service'
import { apiError } from '@/lib/errors'

const createHouseholdSchema = z.object({
  name: z.string().min(1),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  anniversaryDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const search = request.nextUrl.searchParams.get('search') ?? undefined
    const results = await listHouseholds(session, search)
    return NextResponse.json(results)
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = createHouseholdSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const household = await createHousehold(session, parsed.data)
    return NextResponse.json(household, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
