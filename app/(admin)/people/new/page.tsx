import { PersonForm } from '@/components/features/people/person-form'

export default function NewPersonPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add person</h1>
        <p className="text-muted-foreground">Create a new person record.</p>
      </div>
      <PersonForm mode="create" />
    </div>
  )
}
