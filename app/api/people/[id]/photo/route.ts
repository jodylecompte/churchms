import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/auth/session'
import { getPersonById, updatePerson } from '@/domain/people/people.service'
import { saveFile, deleteFile } from '@/storage/storage.service'
import { apiError } from '@/lib/errors'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    const person = await getPersonById(session, id)

    const formData = await request.formData()
    const file = formData.get('photo')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No photo file provided' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Photo exceeds 5 MB limit' }, { status: 400 })
    }

    if (person.profilePhotoKey) {
      await deleteFile(person.profilePhotoKey)
    }

    const key = await saveFile(buffer, file.name, 'photos')
    const updated = await updatePerson(session, id, { profilePhotoKey: key })
    return NextResponse.json({ profilePhotoKey: updated.profilePhotoKey })
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    const person = await getPersonById(session, id)
    if (person.profilePhotoKey) {
      await deleteFile(person.profilePhotoKey)
      await updatePerson(session, id, { profilePhotoKey: undefined })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return apiError(error)
  }
}
