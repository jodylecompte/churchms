import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/auth/session'
import { listPeople } from '@/domain/people/people.service'
import { apiError } from '@/lib/errors'

function escapeCsv(value: string | null | undefined): string {
  if (value == null) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const status = request.nextUrl.searchParams.get('status') ?? undefined
    const persons = await listPeople(session, undefined, status)

    const headers = [
      'first_name', 'last_name', 'preferred_name', 'suffix',
      'email', 'phone', 'phone_type',
      'church_status', 'officer_title', 'membership_date',
      'birth_date', 'is_minor', 'gender', 'marital_status',
      'address_line1', 'address_line2', 'city', 'state', 'zip',
      'household_role', 'directory_visible',
    ]

    const rows = persons.map((p) =>
      [
        p.firstName, p.lastName, p.preferredName, p.suffix,
        p.email, p.phone, p.phoneType,
        p.churchStatus, p.officerTitle, p.membershipDate,
        p.birthDate, p.isMinor ? 'true' : 'false', p.gender, p.maritalStatus,
        p.addressLine1, p.addressLine2, p.city, p.state, p.zip,
        p.householdRole, p.directoryVisible ? 'true' : 'false',
      ].map(escapeCsv).join(',')
    )

    const csv = [headers.join(','), ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="people.csv"',
      },
    })
  } catch (error) {
    return apiError(error)
  }
}
