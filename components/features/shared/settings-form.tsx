'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SettingsFormProps = {
  settings: Record<string, string>
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [form, setForm] = useState({
    church_name: settings.church_name ?? '',
    church_email: settings.church_email ?? '',
    church_phone: settings.church_phone ?? '',
    church_website: settings.church_website ?? '',
    giving_url: settings.giving_url ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save settings')
        return
      }

      setSuccess(true)
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
          <CardTitle>Church Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="church_name">Church name</Label>
            <Input
              id="church_name"
              value={form.church_name}
              onChange={(e) => set('church_name', e.target.value)}
              placeholder="Grace Community Church"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="church_email">Email</Label>
            <Input
              id="church_email"
              type="email"
              value={form.church_email}
              onChange={(e) => set('church_email', e.target.value)}
              placeholder="office@church.org"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="church_phone">Phone</Label>
            <Input
              id="church_phone"
              type="tel"
              value={form.church_phone}
              onChange={(e) => set('church_phone', e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="church_website">Website</Label>
            <Input
              id="church_website"
              type="url"
              value={form.church_website}
              onChange={(e) => set('church_website', e.target.value)}
              placeholder="https://church.org"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="giving_url">Giving link</Label>
            <Input
              id="giving_url"
              type="url"
              value={form.giving_url}
              onChange={(e) => set('giving_url', e.target.value)}
              placeholder="https://give.church.org"
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">Settings saved.</p>}

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Save settings'}
      </Button>
    </form>
  )
}
