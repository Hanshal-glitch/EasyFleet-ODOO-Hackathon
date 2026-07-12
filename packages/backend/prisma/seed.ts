import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role } from '@transport-ops/shared/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@transport-ops.com' },
    update: {},
    create: {
      email: 'admin@transport-ops.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create manager user
  const managerPassword = await bcrypt.hash('Manager@123', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@transport-ops.com' },
    update: {},
    create: {
      email: 'manager@transport-ops.com',
      passwordHash: managerPassword,
      firstName: 'Fleet',
      lastName: 'Manager',
      role: Role.MANAGER,
      isActive: true,
    },
  });
  console.log('✅ Created manager user:', manager.email);

  console.log('🎉 Database seeding completed! (Only core accounts created)');
  console.log('\n📋 Login credentials:');
  console.log('   Admin: admin@transport-ops.com / Admin@123');
  console.log('   Manager: manager@transport-ops.com / Manager@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });