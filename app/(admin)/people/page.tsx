import Link from 'next/link'
import { getSession } from '@/auth/session'
import { listPeople } from '@/domain/people/people.service'
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
import { Plus, Download, Upload } from 'lucide-react'
import { PeopleImport } from '@/components/features/people/people-import'

const STATUS_LABELS: Record<string, string> = {
  visitor: 'Visitor',
  member: 'Member',
  officer: 'Officer',
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>
}) {
  const session = await getSession()
  const { search, status } = await searchParams
  const persons = await listPeople(session, search, status)

  const exportUrl = `/api/people/export${status ? `?status=${status}` : ''}`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">People</h1>
          <p className="text-muted-foreground">{persons.length} record{persons.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href={exportUrl} />}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <PeopleImport />
          <Button render={<Link href="/people/new" />}>
            <Plus className="h-4 w-4 mr-2" />
            Add person
          </Button>
        </div>
      </div>

      {/* Search + filter */}
      <form method="GET" className="flex flex-wrap gap-2">
        <input
          type="search"
          name="search"
          placeholder="Search by name or email…"
          defaultValue={search}
          className="flex h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All statuses</option>
          <option value="visitor">Visitor</option>
          <option value="member">Member</option>
          <option value="officer">Officer</option>
        </select>
        <Button type="submit" variant="secondary" size="sm">Filter</Button>
        {(search || status) && (
          <Button type="button" variant="ghost" size="sm" render={<Link href="/people" />}>
            Clear
          </Button>
        )}
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {persons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {search || status ? 'No results for that search.' : 'No people yet. Add the first one.'}
                </TableCell>
              </TableRow>
            ) : (
              persons.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">
                    {person.lastName}, {person.firstName}
                    {person.preferredName && (
                      <span className="text-muted-foreground ml-1">({person.preferredName})</span>
                    )}
                    {person.isMinor && (
                      <span className="ml-1 text-xs text-muted-foreground">· minor</span>
                    )}
                  </TableCell>
                  <TableCell>{person.email ?? '—'}</TableCell>
                  <TableCell>{person.phone ?? '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={person.churchStatus === 'member' || person.churchStatus === 'officer' ? 'default' : 'secondary'}
                    >
                      {STATUS_LABELS[person.churchStatus] ?? person.churchStatus}
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
  )
}
