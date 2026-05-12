'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Person } from '@/db/schema'

type PersonFormProps = {
  person?: Person
  mode: 'create' | 'edit'
}

export function PersonForm({ person, mode }: PersonFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    firstName: person?.firstName ?? '',
    lastName: person?.lastName ?? '',
    preferredName: person?.preferredName ?? '',
    email: person?.email ?? '',
    phone: person?.phone ?? '',
    phoneType: person?.phoneType ?? '',
    churchStatus: person?.churchStatus ?? 'visitor',
    isMinor: person?.isMinor ?? false,
    birthDate: person?.birthDate ?? '',
    gender: person?.gender ?? '',
    allergyNotes: person?.allergyNotes ?? '',
    medicalNotes: person?.medicalNotes ?? '',
    internalNotes: person?.internalNotes ?? '',
  })

  function set(field: string, value: string | boolean | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        ...form,
        preferredName: form.preferredName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        phoneType: form.phoneType || undefined,
        birthDate: form.birthDate || undefined,
        gender: form.gender || undefined,
        allergyNotes: form.allergyNotes || undefined,
        medicalNotes: form.medicalNotes || undefined,
        internalNotes: form.internalNotes || undefined,
      }

      const res = await fetch(
        mode === 'create' ? '/api/people' : `/api/people/${person!.id}`,
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
      router.push(`/people/${saved.id}`)
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
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name *</Label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name *</Label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredName">Preferred name</Label>
            <Input
              id="preferredName"
              value={form.preferredName}
              onChange={(e) => set('preferredName', e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Input
              id="gender"
              value={form.gender}
              onChange={(e) => set('gender', e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">Birth date</Label>
            <Input
              id="birthDate"
              type="date"
              value={form.birthDate}
              onChange={(e) => set('birthDate', e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="isMinor"
              type="checkbox"
              checked={form.isMinor}
              onChange={(e) => set('isMinor', e.target.checked)}
              disabled={loading}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isMinor">Minor (child)</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneType">Phone type</Label>
            <Select value={form.phoneType} onValueChange={(v) => set('phoneType', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="work">Work</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Church Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="churchStatus">Status</Label>
            <Select value={form.churchStatus} onValueChange={(v) => set('churchStatus', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visitor">Visitor</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="officer">Officer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="allergyNotes" className="text-destructive font-semibold">
              Allergy / medical alerts
            </Label>
            <Textarea
              id="allergyNotes"
              value={form.allergyNotes}
              onChange={(e) => set('allergyNotes', e.target.value)}
              placeholder="List any allergies or critical medical information…"
              rows={3}
              disabled={loading}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="medicalNotes">Medical notes</Label>
            <Textarea
              id="medicalNotes"
              value={form.medicalNotes}
              onChange={(e) => set('medicalNotes', e.target.value)}
              rows={2}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internalNotes">Internal notes</Label>
            <Textarea
              id="internalNotes"
              value={form.internalNotes}
              onChange={(e) => set('internalNotes', e.target.value)}
              rows={2}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : mode === 'create' ? 'Create person' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
