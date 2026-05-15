import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/auth/session'
import { getFileStream } from '@/storage/storage.service'
import path from 'path'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = request.nextUrl.searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

  // Prevent path traversal
  const normalized = path.normalize(key)
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  try {
    const buffer = await getFileStream(key)
    const ext = path.extname(key).toLowerCase()
    const contentType =
      ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.png'
          ? 'image/png'
          : ext === '.webp'
            ? 'image/webp'
            : ext === '.gif'
              ? 'image/gif'
              : 'application/octet-stream'

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
