'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

type ImportResult = {
  created: number
  errors: number
  results: { row: number; name: string; status: string; error?: string }[]
}

export function PeopleImport() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/people/import', { method: 'POST', body: fd })
      const data = await res.json()
      setResult(data)
      router.refresh()
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4 mr-1" />
        {uploading ? 'Importing…' : 'Import CSV'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFile}
      />
      {result && (
        <div className="absolute right-0 top-10 z-10 w-80 rounded-md border bg-background p-3 shadow-md text-sm space-y-2">
          <p className="font-medium">
            Import complete — {result.created} created, {result.errors} error{result.errors !== 1 ? 's' : ''}
          </p>
          {result.results.filter((r) => r.status === 'error').map((r) => (
            <p key={r.row} className="text-destructive text-xs">
              Row {r.row} ({r.name}): {r.error}
            </p>
          ))}
          <Button size="sm" variant="ghost" className="w-full" onClick={() => setResult(null)}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  )
}
