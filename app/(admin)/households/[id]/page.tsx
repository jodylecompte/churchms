import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSession } from '@/auth/session'
import { getHouseholdById, getHouseholdMembers } from '@/domain/households/households.service'
import { HouseholdForm } from '@/components/features/households/household-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronLeft } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  head: 'Head',
  spouse: 'Spouse',
  child: 'Child',
  other: 'Other',
}

export default async function HouseholdPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const { id } = await params

  let household
  let members
  try {
    ;[household, members] = await Promise.all([
      getHouseholdById(session, id),
      getHouseholdMembers(session, id),
    ])
  } catch {
    notFound()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/households" />}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Households
        </Button>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{household.name}</h1>

      <HouseholdForm household={household} mode="edit" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Members</h2>
          <Button variant="outline" size="sm" render={<Link href="/people/new" />}>
            Add person
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                    No members assigned to this household.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">
                      {person.lastName}, {person.firstName}
                      {person.preferredName && (
                        <span className="text-muted-foreground ml-1">({person.preferredName})</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {person.householdRole ? ROLE_LABELS[person.householdRole] ?? person.householdRole : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={person.churchStatus === 'member' || person.churchStatus === 'officer' ? 'default' : 'secondary'}>
                        {person.churchStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" render={<Link href={`/people/${person.id}`} />}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
