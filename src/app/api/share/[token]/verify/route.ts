import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { password } = await request.json()

    const file = await prisma.file.findUnique({
      where: { shareToken: params.token },
    })

    if (!file || file.deletedAt) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (!file.password) {
      return NextResponse.json({ valid: true })
    }

    const isValid = await bcrypt.compare(password, file.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 403 })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
