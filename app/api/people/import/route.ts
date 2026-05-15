import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/auth/session'
import { createPerson } from '@/domain/people/people.service'
import { apiError } from '@/lib/errors'
import { hasRole } from '@/auth/rbac'

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  fields.push(current)
  return fields
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasRole(session.systemRole, 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No CSV file provided' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter((l) => l.trim())
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV has no data rows' }, { status: 400 })
    }

    const headerLine = parseCsvLine(lines[0])
    const idx = (col: string) => headerLine.indexOf(col)

    const results: { row: number; name: string; status: 'created' | 'error'; error?: string }[] = []

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCsvLine(lines[i])
      const firstName = fields[idx('first_name')]?.trim()
      const lastName = fields[idx('last_name')]?.trim()
      const email = fields[idx('email')]?.trim() || undefined
      const phone = fields[idx('phone')]?.trim() || undefined

      if (!firstName || !lastName) {
        results.push({ row: i + 1, name: `row ${i + 1}`, status: 'error', error: 'Missing first_name or last_name' })
        continue
      }
      if (!email && !phone) {
        results.push({ row: i + 1, name: `${firstName} ${lastName}`, status: 'error', error: 'Requires email or phone' })
        continue
      }

      try {
        await createPerson(session, {
          firstName,
          lastName,
          preferredName: fields[idx('preferred_name')]?.trim() || undefined,
          email,
          phone,
          phoneType: (fields[idx('phone_type')]?.trim() || undefined) as 'mobile' | 'home' | 'work' | undefined,
          churchStatus: (fields[idx('church_status')]?.trim() || 'visitor') as 'visitor' | 'member' | 'officer',
        })
        results.push({ row: i + 1, name: `${firstName} ${lastName}`, status: 'created' })
      } catch (err) {
        results.push({
          row: i + 1,
          name: `${firstName} ${lastName}`,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    const created = results.filter((r) => r.status === 'created').length
    const errors = results.filter((r) => r.status === 'error').length

    return NextResponse.json({ created, errors, results })
  } catch (error) {
    return apiError(error)
  }
}
