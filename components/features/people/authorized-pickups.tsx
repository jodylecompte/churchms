'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AuthorizedPickup } from '@/db/schema'
import { Plus, Trash2, ShieldAlert } from 'lucide-react'

export function AuthorizedPickupsPanel({ personId }: { personId: string }) {
  const [pickups, setPickups] = useState<AuthorizedPickup[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    externalName: '',
    externalPhone: '',
    relationship: '',
    isDenied: false,
    notes: '',
  })

  const load = useCallback(() => {
    fetch(`/api/people/${personId}/authorized-pickups`)
      .then((r) => r.json())
      .then(setPickups)
      .catch(() => undefined)
  }, [personId])

  useEffect(() => { load() }, [load])

  function setField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/people/${personId}/authorized-pickups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalName: form.externalName || undefined,
          externalPhone: form.externalPhone || undefined,
          relationship: form.relationship || undefined,
          isDenied: form.isDenied,
          notes: form.notes || undefined,
        }),
      })
      if (res.ok) {
        setForm({ externalName: '', externalPhone: '', relationship: '', isDenied: false, notes: '' })
        setShowForm(false)
        load()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/people/${personId}/authorized-pickups/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Authorized Pickups</CardTitle>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {pickups.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground">No pickup authorizations recorded.</p>
        )}
        {pickups.map((p) => (
          <div
            key={p.id}
            className={`flex items-start justify-between rounded-md border p-3 ${
              p.isDenied ? 'border-destructive/50 bg-destructive/5' : ''
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                {p.isDenied && <ShieldAlert className="h-4 w-4 text-destructive" />}
                <p className="font-medium">{p.externalName ?? 'Person in system'}</p>
                {p.isDenied && <Badge variant="destructive" className="text-xs">DENIED</Badge>}
              </div>
              {p.relationship && <p className="text-sm text-muted-foreground">{p.relationship}</p>}
              {p.externalPhone && <p className="text-sm">{p.externalPhone}</p>}
              {p.notes && <p className="text-sm text-muted-foreground mt-1">{p.notes}</p>}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => handleDelete(p.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {showForm && (
          <form onSubmit={handleAdd} className="space-y-3 rounded-md border p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="ap-name">Name *</Label>
                <Input id="ap-name" value={form.externalName} onChange={(e) => setField('externalName', e.target.value)} required={!form.isDenied} disabled={saving} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ap-phone">Phone</Label>
                <Input id="ap-phone" type="tel" value={form.externalPhone} onChange={(e) => setField('externalPhone', e.target.value)} disabled={saving} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ap-relationship">Relationship</Label>
                <Input id="ap-relationship" value={form.relationship} onChange={(e) => setField('relationship', e.target.value)} disabled={saving} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="ap-notes">Notes</Label>
                <Input id="ap-notes" value={form.notes} onChange={(e) => setField('notes', e.target.value)} disabled={saving} />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  id="ap-denied"
                  type="checkbox"
                  checked={form.isDenied}
                  onChange={(e) => setField('isDenied', e.target.checked)}
                  disabled={saving}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="ap-denied" className="text-destructive font-medium">
                  Mark as DENIED (never allow pickup)
                </Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
