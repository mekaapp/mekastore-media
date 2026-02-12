import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')

export function getUploadDir(): string {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true })
  }
  return UPLOAD_DIR
}

export function generateStoredName(originalName: string): string {
  const ext = originalName.split('.').pop() || ''
  const hash = crypto.randomUUID()
  return `${hash}.${ext}`
}

export function getFilePath(storedName: string): string {
  return join(getUploadDir(), storedName)
}

export function formatFileSize(bytes: number | bigint): string {
  const b = Number(bytes)
  if (b === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(b) / Math.log(k))
  return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getMimeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'music'
  if (mimeType.includes('pdf')) return 'file-text'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'file-text'
  return 'file'
}
