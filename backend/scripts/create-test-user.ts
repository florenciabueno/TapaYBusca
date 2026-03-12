import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const email = 'test@example.com';
    const password = 'test1234';
    const name = 'Test User';

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('❌ User already exists:', email);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    });

    console.log('✅ Test user created successfully:');
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   ID:', user.id);
    console.log('\n📝 Login credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
