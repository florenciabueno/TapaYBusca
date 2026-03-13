import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Deletes all default equations and their relations (user_equations,
 * published_equations). Useful for Neon/production before re-running
 * the seed with the new default equations definition.
 *
 * Usage: npm run db:clear-default-equations
 * (Ensure DATABASE_URL points to the database you are using)
 */
async function clearDefaultEquations() {
  console.log('🧹 Clearing default equations and their relations...\n');

  try {
    const defaultEquations = await prisma.equation.findMany({
      where: { isDefault: true },
      select: { id: true },
    });
    const ids = defaultEquations.map((e) => e.id);

    if (ids.length === 0) {
      console.log('   No default equations in the database.');
      return;
    }

    await prisma.$transaction(async (tx) => {
      const deletedUserEq = await tx.userEquation.deleteMany({
        where: { equationId: { in: ids } },
      });
      console.log(`   ✅ ${deletedUserEq.count} rows deleted from user_equations`);

      const deletedPublished = await tx.publishedEquation.deleteMany({
        where: { equationId: { in: ids } },
      });
      console.log(`   ✅ ${deletedPublished.count} rows deleted from published_equations`);

      const deletedEq = await tx.equation.deleteMany({
        where: { id: { in: ids } },
      });
      console.log(`   ✅ ${deletedEq.count} default equations deleted`);
    });

    console.log('\n✅ Cleanup complete. You can run: npm run db:seed-equations');
  } catch (error) {
    console.error('\n❌ Error clearing default equations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearDefaultEquations();
