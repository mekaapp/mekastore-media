import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const folderId = searchParams.get('folderId')
  const search = searchParams.get('search')

  const where: any = { deletedAt: null }
  if (folderId) {
    where.folderId = folderId
  } else {
    where.folderId = null
  }
  if (search) {
    where.originalName = { contains: search, mode: 'insensitive' }
  }

  const [files, folders] = await Promise.all([
    prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: { select: { name: true } } },
    }),
    prisma.folder.findMany({
      where: { parentId: folderId || null },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { files: true, children: true } },
      },
    }),
  ])

  return NextResponse.json({
    files: files.map((f) => ({
      ...f,
      size: Number(f.size),
    })),
    folders,
  })
}
