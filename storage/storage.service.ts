import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const STORAGE_ROOT = process.env.STORAGE_ROOT ?? path.join(process.cwd(), 'uploads')

export async function saveFile(
  buffer: Buffer,
  originalName: string,
  folder: string
): Promise<string> {
  const ext = path.extname(originalName).toLowerCase()
  const key = `${folder}/${crypto.randomUUID()}${ext}`
  const fullPath = path.join(STORAGE_ROOT, key)

  await fs.mkdir(path.dirname(fullPath), { recursive: true })
  await fs.writeFile(fullPath, buffer)
  return key
}

export async function getFileStream(key: string): Promise<Buffer> {
  const fullPath = path.join(STORAGE_ROOT, key)
  return fs.readFile(fullPath)
}

export async function deleteFile(key: string): Promise<void> {
  const fullPath = path.join(STORAGE_ROOT, key)
  await fs.unlink(fullPath).catch(() => undefined)
}
