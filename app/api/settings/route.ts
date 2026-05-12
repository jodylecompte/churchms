import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/auth/session'
import { getSettings, setSettings } from '@/domain/settings/settings.service'
import { apiError } from '@/lib/errors'

const settingsSchema = z.object({
  church_name: z.string().optional(),
  church_email: z.string().email().optional().or(z.literal('')),
  church_phone: z.string().optional(),
  church_website: z.string().url().optional().or(z.literal('')),
  giving_url: z.string().url().optional().or(z.literal('')),
})

export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json(settings)
  } catch (error) {
    return apiError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = settingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    await setSettings(session, parsed.data)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error)
  }
}
