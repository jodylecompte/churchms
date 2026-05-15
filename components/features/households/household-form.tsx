'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Household } from '@/db/schema'

type HouseholdFormProps = {
  household?: Household
  mode: 'create' | 'edit'
}

export function HouseholdForm({ household, mode }: HouseholdFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: household?.name ?? '',
    addressLine1: household?.addressLine1 ?? '',
    addressLine2: household?.addressLine2 ?? '',
    city: household?.city ?? '',
    state: household?.state ?? '',
    zip: household?.zip ?? '',
    anniversaryDate: household?.anniversaryDate ?? '',
    notes: household?.notes ?? '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function opt(v: string) {
    return v || undefined
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        name: form.name,
        addressLine1: opt(form.addressLine1),
        addressLine2: opt(form.addressLine2),
        city: opt(form.city),
        state: opt(form.state),
        zip: opt(form.zip),
        anniversaryDate: opt(form.anniversaryDate),
        notes: opt(form.notes),
      }

      const res = await fetch(
        mode === 'create' ? '/api/households' : `/api/households/${household!.id}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
        return
      }

      const saved = await res.json()
      router.push(`/households/${saved.id}`)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Household</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={form.name}
              placeholder="Smith Family"
              onChange={(e) => set('name', e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="anniversaryDate">Anniversary date</Label>
            <Input
              id="anniversaryDate"
              type="date"
              value={form.anniversaryDate}
              onChange={(e) => set('anniversaryDate', e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="addressLine1">Street address</Label>
            <Input id="addressLine1" value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="addressLine2">Apt / Suite</Label>
            <Input id="addressLine2" value={form.addressLine2} onChange={(e) => set('addressLine2', e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={form.city} onChange={(e) => set('city', e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" value={form.state} maxLength={2} onChange={(e) => set('state', e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP</Label>
            <Input id="zip" value={form.zip} onChange={(e) => set('zip', e.target.value)} disabled={loading} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            disabled={loading}
          />
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : mode === 'create' ? 'Create household' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
