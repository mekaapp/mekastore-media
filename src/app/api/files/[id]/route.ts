import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFilePath } from '@/lib/storage'
import { unlink } from 'fs/promises'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const file = await prisma.file.findUnique({ where: { id: params.id } })
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    await prisma.file.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    try {
      await unlink(getFilePath(file.storedName))
    } catch {}

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { isPublic, password } = body

    const updateData: any = {}
    if (typeof isPublic === 'boolean') updateData.isPublic = isPublic
    if (password !== undefined) {
      const bcrypt = await import('bcryptjs')
      updateData.password = password ? await bcrypt.hash(password, 12) : null
    }

    const file = await prisma.file.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({
      ...file,
      size: Number(file.size),
    })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
