import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSession } from '@/auth/session'
import { getPersonById } from '@/domain/people/people.service'
import { PersonForm } from '@/components/features/people/person-form'
import { EmergencyContactsPanel } from '@/components/features/people/emergency-contacts'
import { AuthorizedPickupsPanel } from '@/components/features/people/authorized-pickups'
import { PersonPhotoSection } from '@/components/features/people/person-photo-section'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, AlertTriangle } from 'lucide-react'

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const { id } = await params

  let person
  try {
    person = await getPersonById(session, id)
  } catch {
    notFound()
  }

  const displayName = person.preferredName
    ? `${person.preferredName} ${person.lastName}`
    : `${person.firstName} ${person.lastName}`

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/people" />}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          People
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={person.churchStatus === 'member' ? 'default' : 'secondary'}>
              {person.churchStatus}
            </Badge>
            {person.officerTitle && (
              <Badge variant="outline">{person.officerTitle}</Badge>
            )}
            {person.isMinor && <Badge variant="outline">Minor</Badge>}
            {!person.directoryVisible && (
              <Badge variant="secondary" className="text-xs">Hidden from directory</Badge>
            )}
          </div>
        </div>
      </div>

      <PersonPhotoSection
        personId={id}
        initialPhotoKey={person.profilePhotoKey}
        displayName={displayName}
      />

      {person.allergyNotes && (
        <div className="flex gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-destructive">Allergy / Medical Alert</p>
            <p className="text-sm text-destructive/90">{person.allergyNotes}</p>
          </div>
        </div>
      )}

      <PersonForm person={person} mode="edit" />

      <EmergencyContactsPanel personId={id} />

      {person.isMinor && <AuthorizedPickupsPanel personId={id} />}
    </div>
  )
}
