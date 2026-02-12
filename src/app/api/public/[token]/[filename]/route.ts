import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFilePath } from '@/lib/storage'
import { readFile, stat } from 'fs/promises'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string; filename: string } }
) {
  try {
    const file = await prisma.file.findUnique({
      where: { shareToken: params.token },
    })

    if (!file || file.deletedAt) {
      return new NextResponse('Not Found', { status: 404 })
    }

    if (!file.isPublic) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    if (file.expiresAt && new Date(file.expiresAt) < new Date()) {
      return new NextResponse('Link Expired', { status: 410 })
    }

    await prisma.file.update({
      where: { id: file.id },
      data: { downloadCount: { increment: 1 } },
    })

    const filePath = getFilePath(file.storedName)
    const fileStat = await stat(filePath)
    const range = request.headers.get('range')

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileStat.size - 1
      const chunkSize = end - start + 1

      const { createReadStream } = await import('fs')
      const stream = createReadStream(filePath, { start, end })
      const readable = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk))
          stream.on('end', () => controller.close())
          stream.on('error', (err) => controller.error(err))
        },
      })

      return new NextResponse(readable as any, {
        status: 206,
        headers: {
          'Content-Type': file.mimeType,
          'Content-Range': `bytes ${start}-${end}/${fileStat.size}`,
          'Content-Length': String(chunkSize),
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }

    const buffer = await readFile(filePath)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Length': String(fileStat.size),
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
      },
    })
  } catch (error) {
    console.error('Public file error:', error)
    return new NextResponse('Server Error', { status: 500 })
  }
}
