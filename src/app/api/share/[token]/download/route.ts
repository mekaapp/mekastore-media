import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFilePath } from '@/lib/storage'
import { readFile } from 'fs/promises'
import bcrypt from 'bcryptjs'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const file = await prisma.file.findUnique({
      where: { shareToken: params.token },
    })

    if (!file || file.deletedAt) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (file.expiresAt && new Date(file.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Link expired' }, { status: 410 })
    }

    if (file.password) {
      const pwd = request.nextUrl.searchParams.get('pwd')
      if (!pwd) {
        return NextResponse.json({ error: 'Password required' }, { status: 403 })
      }
      const isValid = await bcrypt.compare(pwd, file.password)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 403 })
      }
    }

    await prisma.file.update({
      where: { id: file.id },
      data: { downloadCount: { increment: 1 } },
    })

    const buffer = await readFile(getFilePath(file.storedName))

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
        'Content-Length': String(file.size),
      },
    })
  } catch (error) {
    console.error('Share download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
