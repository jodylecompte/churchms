'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EmergencyContact } from '@/db/schema'
import { Plus, Trash2 } from 'lucide-react'

export function EmergencyContactsPanel({ personId }: { personId: string }) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', relationship: '', phone: '', email: '', notes: '' })

  const load = useCallback(() => {
    fetch(`/api/people/${personId}/emergency-contacts`)
      .then((r) => r.json())
      .then(setContacts)
      .catch(() => undefined)
  }, [personId])

  useEffect(() => { load() }, [load])

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/people/${personId}/emergency-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          relationship: form.relationship || undefined,
          phone: form.phone,
          email: form.email || undefined,
          notes: form.notes || undefined,
        }),
      })
      if (res.ok) {
        setForm({ name: '', relationship: '', phone: '', email: '', notes: '' })
        setShowForm(false)
        load()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/people/${personId}/emergency-contacts/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Emergency Contacts</CardTitle>
        {!showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {contacts.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground">No emergency contacts recorded.</p>
        )}
        {contacts.map((c) => (
          <div key={c.id} className="flex items-start justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">{c.name}</p>
              {c.relationship && <p className="text-sm text-muted-foreground">{c.relationship}</p>}
              <p className="text-sm">{c.phone}</p>
              {c.email && <p className="text-sm text-muted-foreground">{c.email}</p>}
              {c.notes && <p className="text-sm text-muted-foreground mt-1">{c.notes}</p>}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => handleDelete(c.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {showForm && (
          <form onSubmit={handleAdd} className="space-y-3 rounded-md border p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="ec-name">Name *</Label>
                <Input id="ec-name" value={form.name} onChange={(e) => setField('name', e.target.value)} required disabled={saving} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ec-relationship">Relationship</Label>
                <Input id="ec-relationship" value={form.relationship} onChange={(e) => setField('relationship', e.target.value)} disabled={saving} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ec-phone">Phone *</Label>
                <Input id="ec-phone" type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} required disabled={saving} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ec-email">Email</Label>
                <Input id="ec-email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} disabled={saving} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="ec-notes">Notes</Label>
                <Input id="ec-notes" value={form.notes} onChange={(e) => setField('notes', e.target.value)} disabled={saving} />
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
