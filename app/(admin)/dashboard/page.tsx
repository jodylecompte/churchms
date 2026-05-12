import Link from 'next/link'
import { getSession } from '@/auth/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { countPeople } from '@/domain/people/people.service'
import { getSettings } from '@/domain/settings/settings.service'
import { Users, Baby, Calendar, MessageSquare, Plus } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getSession()
  const [peopleCount, settings] = await Promise.all([countPeople(), getSettings()])

  const churchName = settings.church_name ?? 'Your Church'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{churchName}</h1>
        <p className="text-muted-foreground">Welcome back, {session.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total People</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{peopleCount}</div>
            <p className="text-xs text-muted-foreground">in directory</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-Ins Today</CardTitle>
            <Baby className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">coming in Milestone 3</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volunteers Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">coming in Milestone 4</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Board Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">coming in Milestone 5</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button render={<Link href="/people/new" />}>
          <Plus className="h-4 w-4 mr-2" />
          Add person
        </Button>
        <Button variant="outline" render={<Link href="/people" />}>
          View directory
        </Button>
      </div>
    </div>
  )
}
