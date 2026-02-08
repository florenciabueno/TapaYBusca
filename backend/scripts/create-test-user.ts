import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const email = 'test@example.com';
    const password = 'test1234';
    const name = 'Usuario de Prueba';

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('❌ El usuario ya existe:', email);
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

    console.log('✅ Usuario de prueba creado exitosamente:');
    console.log('   Email:', user.email);
    console.log('   Nombre:', user.name);
    console.log('   ID:', user.id);
    console.log('\n📝 Credenciales para login:');
    console.log('   Email:', email);
    console.log('   Password:', password);
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
