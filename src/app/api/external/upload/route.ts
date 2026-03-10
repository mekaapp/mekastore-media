import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUploadDir, generateStoredName } from '@/lib/storage'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

const UPLOAD_API_KEY = process.env.UPLOAD_API_KEY

function authenticateApiKey(request: NextRequest): boolean {
  if (!UPLOAD_API_KEY) return false
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  const key = authHeader.replace('Bearer ', '').trim()
  return key === UPLOAD_API_KEY
}

// Find or create the system upload user for external uploads
async function getSystemUser() {
  const email = 'system@mekastore.com'
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    const bcrypt = await import('bcryptjs')
    user = await prisma.user.create({
      data: {
        name: 'System',
        email,
        password: await bcrypt.hash(crypto.randomUUID(), 10),
        role: 'ADMIN',
      },
    })
  }
  return user
}

export async function POST(request: NextRequest) {
  if (!authenticateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as globalThis.File | null
    const source = (formData.get('source') as string) || 'erp'
    const context = (formData.get('context') as string) || 'support_chat'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400, headers: corsHeaders })
    }

    // Validate file size (50MB max for chat attachments)
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 413, headers: corsHeaders })
    }

    const systemUser = await getSystemUser()
    const uploadDir = getUploadDir()
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const storedName = generateStoredName(file.name)
    const filePath = join(uploadDir, storedName)

    await writeFile(filePath, buffer)

    const dbFile = await prisma.file.create({
      data: {
        originalName: file.name,
        storedName,
        mimeType: file.type || 'application/octet-stream',
        size: BigInt(file.size),
        isPublic: true,
        uploadedById: systemUser.id,
      },
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'https://media.mekastore.com'
    const publicUrl = `${baseUrl}/api/public/${dbFile.shareToken}/${encodeURIComponent(dbFile.originalName)}`
    const shareUrl = `${baseUrl}/share/${dbFile.shareToken}`

    return NextResponse.json({
      id: dbFile.id,
      name: dbFile.originalName,
      mimeType: dbFile.mimeType,
      size: Number(dbFile.size),
      shareToken: dbFile.shareToken,
      publicUrl,
      shareUrl,
      source,
      context,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('External upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500, headers: corsHeaders })
  }
}
