import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUploadDir, generateStoredName } from '@/lib/storage'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as globalThis.File[]
    const folderId = formData.get('folderId') as string | null
    const isPublic = formData.get('isPublic') === 'true'

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadDir = getUploadDir()
    const results = []

    for (const file of files) {
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
          isPublic,
          uploadedById: (session.user as any).id,
          folderId: folderId || null,
        },
      })

      results.push({
        id: dbFile.id,
        name: dbFile.originalName,
        size: Number(dbFile.size),
        shareToken: dbFile.shareToken,
        shareUrl: `${process.env.NEXTAUTH_URL || ''}/share/${dbFile.shareToken}`,
        directUrl: dbFile.isPublic
          ? `${process.env.NEXTAUTH_URL || ''}/api/public/${dbFile.shareToken}/${encodeURIComponent(dbFile.originalName)}`
          : null,
      })
    }

    return NextResponse.json({ files: results })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
