import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [fileStats, totalFolders, recentFiles] = await Promise.all([
      prisma.file.aggregate({
        where: { deletedAt: null },
        _count: true,
        _sum: { size: true, downloadCount: true },
      }),
      prisma.folder.count(),
      prisma.file.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          originalName: true,
          size: true,
          isPublic: true,
          downloadCount: true,
          createdAt: true,
        },
      }),
    ])

    return NextResponse.json({
      totalFiles: fileStats._count,
      totalSize: Number(fileStats._sum.size || 0),
      totalDownloads: fileStats._sum.downloadCount || 0,
      totalFolders,
      recentFiles: recentFiles.map((f) => ({ ...f, size: Number(f.size) })),
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
