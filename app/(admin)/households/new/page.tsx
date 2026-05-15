import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HouseholdForm } from '@/components/features/households/household-form'
import { ChevronLeft } from 'lucide-react'

export default function NewHouseholdPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/households" />}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Households
        </Button>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">New Household</h1>
      <HouseholdForm mode="create" />
    </div>
  )
}
