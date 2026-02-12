import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const file = await prisma.file.findUnique({
      where: { shareToken: params.token },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        size: true,
        isPublic: true,
        password: true,
        downloadCount: true,
        createdAt: true,
        expiresAt: true,
        deletedAt: true,
        uploadedBy: { select: { name: true } },
      },
    })

    if (!file || file.deletedAt) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (file.expiresAt && new Date(file.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Link expired' }, { status: 410 })
    }

    return NextResponse.json({
      name: file.originalName,
      mimeType: file.mimeType,
      size: Number(file.size),
      isPublic: file.isPublic,
      hasPassword: !!file.password,
      downloadCount: file.downloadCount,
      uploadedBy: file.uploadedBy.name,
      createdAt: file.createdAt,
    })
  } catch (error) {
    console.error('Share info error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
