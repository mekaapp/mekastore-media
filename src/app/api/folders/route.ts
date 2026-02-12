import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, parentId } = await request.json()
    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        parentId: parentId || null,
        createdById: (session.user as any).id,
      },
    })

    return NextResponse.json(folder)
  } catch (error) {
    console.error('Create folder error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
