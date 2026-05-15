'use client'

import { useState } from 'react'
import { PhotoUpload } from './photo-upload'

type Props = {
  personId: string
  initialPhotoKey: string | null
  displayName: string
}

export function PersonPhotoSection({ personId, initialPhotoKey, displayName }: Props) {
  const [photoKey, setPhotoKey] = useState(initialPhotoKey)
  return (
    <PhotoUpload
      personId={personId}
      photoKey={photoKey}
      displayName={displayName}
      onUpdate={setPhotoKey}
    />
  )
}
