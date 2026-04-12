import { PrismaClient } from '@prisma/client';
import { solveEquation } from '../src/modules/equations/equation-solver/index.js';

const prisma = new PrismaClient();

/**
 * Sets `solutionValues` on existing default equations (rows seeded before
 * solutionValues were written). Safe to run multiple times.
 *
 * Usage: npx tsx scripts/backfill-default-equation-solutions.ts
 */
async function backfill() {
  const defaults = await prisma.equation.findMany({
    where: { isDefault: true },
    select: { id: true, infixExpression: true },
  });

  let updated = 0;
  for (const row of defaults) {
    const infija = row.infixExpression?.trim() ?? '';
    if (!infija) continue;
    const solved = solveEquation(infija);
    if (!solved.ok) {
      console.warn(`Omitido (sin solución o inválida): "${infija}" — ${solved.message ?? solved.errorCode}`);
      continue;
    }
    await prisma.equation.update({
      where: { id: row.id },
      data: { solutionValues: solved.solutions },
    });
    updated += 1;
  }

  console.log(`Actualizadas ${updated} ecuaciones por defecto de ${defaults.length}.`);
}

backfill()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
