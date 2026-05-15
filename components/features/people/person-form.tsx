'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Person, Household } from '@/db/schema'
import { AlertTriangle, Eye } from 'lucide-react'

type VisibilityMap = { email: string; phone: string; address: string; birthDate: string }

const VISIBILITY_FIELDS: Array<{ key: keyof VisibilityMap; label: string }> = [
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'birthDate', label: 'Birth date' },
]

const VISIBILITY_DEFAULTS: VisibilityMap = {
  email: 'public',
  phone: 'public',
  address: 'public',
  birthDate: 'staff_only',
}

type PersonFormProps = {
  person?: Person
  mode: 'create' | 'edit'
}

export function PersonForm({ person, mode }: PersonFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [households, setHouseholds] = useState<Household[]>([])
  const [visibility, setVisibility] = useState<VisibilityMap>({ ...VISIBILITY_DEFAULTS })

  const [form, setForm] = useState({
    firstName: person?.firstName ?? '',
    lastName: person?.lastName ?? '',
    preferredName: person?.preferredName ?? '',
    suffix: person?.suffix ?? '',
    email: person?.email ?? '',
    phone: person?.phone ?? '',
    phoneType: person?.phoneType ?? '',
    churchStatus: person?.churchStatus ?? 'visitor',
    officerTitle: person?.officerTitle ?? '',
    membershipDate: person?.membershipDate ?? '',
    receivedFrom: person?.receivedFrom ?? '',
    isMinor: person?.isMinor ?? false,
    householdId: person?.householdId ?? '',
    householdRole: person?.householdRole ?? '',
    birthDate: person?.birthDate ?? '',
    gender: person?.gender ?? '',
    maritalStatus: person?.maritalStatus ?? '',
    addressLine1: person?.addressLine1 ?? '',
    addressLine2: person?.addressLine2 ?? '',
    city: person?.city ?? '',
    state: person?.state ?? '',
    zip: person?.zip ?? '',
    allergyNotes: person?.allergyNotes ?? '',
    medicalNotes: person?.medicalNotes ?? '',
    internalNotes: person?.internalNotes ?? '',
    baptismDate: person?.baptismDate ?? '',
    baptismType: person?.baptismType ?? '',
    directoryVisible: person?.directoryVisible ?? true,
  })

  useEffect(() => {
    fetch('/api/households')
      .then((r) => r.json())
      .then(setHouseholds)
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (mode === 'edit' && person?.id) {
      fetch(`/api/people/${person.id}/visibility`)
        .then((r) => r.json())
        .then((data) => setVisibility((prev) => ({ ...prev, ...data })))
        .catch(() => undefined)
    }
  }, [mode, person?.id])

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function opt(v: string) {
    return v || undefined
  }

  async function handleVisibilityChange(fieldName: keyof VisibilityMap, value: string) {
    setVisibility((prev) => ({ ...prev, [fieldName]: value }))
    if (mode === 'edit' && person?.id) {
      await fetch(`/api/people/${person.id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldName, visibility: value }),
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        preferredName: opt(form.preferredName),
        suffix: opt(form.suffix),
        email: opt(form.email),
        phone: opt(form.phone),
        phoneType: opt(form.phoneType),
        churchStatus: form.churchStatus,
        officerTitle: opt(form.officerTitle),
        membershipDate: opt(form.membershipDate),
        receivedFrom: opt(form.receivedFrom),
        isMinor: form.isMinor,
        householdId: opt(form.householdId),
        householdRole: opt(form.householdRole),
        birthDate: opt(form.birthDate),
        gender: opt(form.gender),
        maritalStatus: opt(form.maritalStatus),
        addressLine1: opt(form.addressLine1),
        addressLine2: opt(form.addressLine2),
        city: opt(form.city),
        state: opt(form.state),
        zip: opt(form.zip),
        allergyNotes: opt(form.allergyNotes),
        medicalNotes: opt(form.medicalNotes),
        internalNotes: opt(form.internalNotes),
        baptismDate: opt(form.baptismDate),
        baptismType: opt(form.baptismType),
        directoryVisible: form.directoryVisible,
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
      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name *</Label>
            <Input id="firstName" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name *</Label>
            <Input id="lastName" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredName">Preferred name</Label>
            <Input id="preferredName" value={form.preferredName} onChange={(e) => set('preferredName', e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="suffix">Suffix</Label>
            <Input id="suffix" value={form.suffix} placeholder="Jr., Sr., III…" onChange={(e) => set('suffix', e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Input id="gender" value={form.gender} onChange={(e) => set('gender', e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Marital status</Label>
            <Select value={form.maritalStatus} onValueChange={(v) => set('maritalStatus', v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">Birth date</Label>
            <Input id="birthDate" type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} disabled={loading} />
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

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneType">Phone type</Label>
            <Select value={form.phoneType} onValueChange={(v) => set('phoneType', v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="work">Work</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
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

      {/* Household */}
      <Card>
        <CardHeader>
          <CardTitle>Household</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="householdId">Household</Label>
            <Select value={form.householdId} onValueChange={(v) => set('householdId', !v || v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {households.map((h) => (
                  <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="householdRole">Role in household</Label>
            <Select value={form.householdRole} onValueChange={(v) => set('householdRole', !v || v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="head">Head</SelectItem>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Church Status */}
      <Card>
        <CardHeader>
          <CardTitle>Church Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="churchStatus">Status</Label>
            <Select value={form.churchStatus} onValueChange={(v) => set('churchStatus', v ?? 'visitor')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="visitor">Visitor</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="officer">Officer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.churchStatus === 'officer' && (
            <div className="space-y-2">
              <Label htmlFor="officerTitle">Officer title</Label>
              <Input id="officerTitle" value={form.officerTitle} placeholder="Pastor, Deacon…" onChange={(e) => set('officerTitle', e.target.value)} disabled={loading} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="membershipDate">Membership date</Label>
            <Input id="membershipDate" type="date" value={form.membershipDate} onChange={(e) => set('membershipDate', e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receivedFrom">Received from</Label>
            <Input id="receivedFrom" value={form.receivedFrom} placeholder="Previous church name…" onChange={(e) => set('receivedFrom', e.target.value)} disabled={loading} />
          </div>
        </CardContent>
      </Card>

      {/* Baptism */}
      <Card>
        <CardHeader>
          <CardTitle>Baptism</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="baptismDate">Baptism date</Label>
            <Input id="baptismDate" type="date" value={form.baptismDate} onChange={(e) => set('baptismDate', e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baptismType">Baptism type</Label>
            <Input id="baptismType" value={form.baptismType} placeholder="Infant, Believer's…" onChange={(e) => set('baptismType', e.target.value)} disabled={loading} />
          </div>
        </CardContent>
      </Card>

      {/* Staff Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
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
                className="border-destructive/40"
              />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="medicalNotes">Medical notes</Label>
            <Textarea id="medicalNotes" value={form.medicalNotes} onChange={(e) => set('medicalNotes', e.target.value)} rows={2} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internalNotes">Internal notes</Label>
            <Textarea id="internalNotes" value={form.internalNotes} onChange={(e) => set('internalNotes', e.target.value)} rows={2} disabled={loading} />
          </div>
        </CardContent>
      </Card>

      {/* Field Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Field Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Controls which fields are visible to members when they browse the directory.
            Staff always see all fields.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {VISIBILITY_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <Label className="text-sm">{label}</Label>
                <Select
                  value={visibility[key]}
                  onValueChange={(v) => v && handleVisibilityChange(key, v)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="staff_only">Staff only</SelectItem>
                    <SelectItem value="self_only">Self only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Directory */}
      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <input
              id="directoryVisible"
              type="checkbox"
              checked={form.directoryVisible}
              onChange={(e) => set('directoryVisible', e.target.checked)}
              disabled={loading}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="directoryVisible">Visible in directory</Label>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
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
