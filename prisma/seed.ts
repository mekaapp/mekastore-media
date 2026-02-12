import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@mekastore.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@mekastore.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Seed completed: admin@mekastore.com / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
