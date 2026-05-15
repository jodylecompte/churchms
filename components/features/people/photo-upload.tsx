'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Trash2 } from 'lucide-react'
import Image from 'next/image'

type PhotoUploadProps = {
  personId: string
  photoKey: string | null
  displayName: string
  onUpdate: (key: string | null) => void
}

export function PhotoUpload({ personId, photoKey, displayName, onUpdate }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const res = await fetch(`/api/people/${personId}/photo`, { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Upload failed')
        return
      }
      const data = await res.json()
      onUpdate(data.profilePhotoKey)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove() {
    setUploading(true)
    try {
      await fetch(`/api/people/${personId}/photo`, { method: 'DELETE' })
      onUpdate(null)
    } finally {
      setUploading(false)
    }
  }

  const src = photoKey ? `/api/files?key=${encodeURIComponent(photoKey)}` : null

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted flex items-center justify-center border">
        {src ? (
          <Image src={src} alt={displayName} fill className="object-cover" unoptimized />
        ) : (
          <span className="text-2xl text-muted-foreground font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="h-4 w-4 mr-1" />
            {uploading ? 'Uploading…' : 'Change photo'}
          </Button>
          {photoKey && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={uploading}
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP — max 5 MB</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
