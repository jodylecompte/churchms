import Link from 'next/link'
import { getSession } from '@/auth/session'
import { listHouseholds } from '@/domain/households/households.service'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus } from 'lucide-react'

export default async function HouseholdsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const session = await getSession()
  const { search } = await searchParams
  const householdList = await listHouseholds(session, search)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Households</h1>
          <p className="text-muted-foreground">
            {householdList.length} household{householdList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button render={<Link href="/households/new" />}>
          <Plus className="h-4 w-4 mr-2" />
          Add household
        </Button>
      </div>

      <form method="GET" className="flex gap-2">
        <input
          type="search"
          name="search"
          placeholder="Search by name…"
          defaultValue={search}
          className="flex h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <Button type="submit" variant="secondary" size="sm">Search</Button>
        {search && (
          <Button type="button" variant="ghost" size="sm" render={<Link href="/households" />}>
            Clear
          </Button>
        )}
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {householdList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  {search ? 'No results for that search.' : 'No households yet. Add the first one.'}
                </TableCell>
              </TableRow>
            ) : (
              householdList.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{h.city ?? '—'}</TableCell>
                  <TableCell>{h.state ?? '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" render={<Link href={`/households/${h.id}`} />}>
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
