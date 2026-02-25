import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 40 ecuaciones definitivas con notación infija, postfija y LaTeX
const defaultEquations = [
  { infija: 'x+5=12', postfija: 'x5+12=', latex: 'x+5=12' },
  { infija: '2*(x+5)=12', postfija: '2x5+*12=', latex: '2\\cdot(x+5)=12' },
  { infija: '((150)/(x+10))=30', postfija: '150x10+/30=', latex: '\\frac{150}{x+10}=30' },
  { infija: 'raiz2(x+5)=4', postfija: 'x5+raiz24=', latex: '\\sqrt{x+5}=4' },
  { infija: '25=pot2(x)', postfija: '25xpot2=', latex: '25=x^2' },
  { infija: 'pot2(x+2)+10=26', postfija: 'x2+pot210+26=', latex: '(x+2)^2+10=26' },
  { infija: 'raiz3(((40)/(x+1)))=2', postfija: '40x1+/raiz32=', latex: '\\sqrt[3]{\\frac{40}{x+1}}=2' },
  { infija: '20=84-pot3(x)', postfija: '2084xpot3-=', latex: '20=84-x^3' },
  { infija: '((360)/(pot2(x)-13))=10', postfija: '360xpot213-/10=', latex: '\\frac{360}{x^2-13}=10' },
  { infija: 'x+15=10', postfija: 'x15+10=', latex: 'x+15=10' },
  { infija: '2*x+9=7', postfija: '2x*9+7=', latex: '2\\cdot x+9=7' },
  { infija: '10=3*x+4', postfija: '103x*4+=', latex: '10=3\\cdot x+4' },
  { infija: '9=raiz2(1+raiz2(x))', postfija: '91xraiz2+raiz2=', latex: '9=\\sqrt{1+\\sqrt{x}}' },
  { infija: '3=((15)/(x+2))', postfija: '315x2+/=', latex: '3=\\frac{15}{x+2}' },
  { infija: '((8)/(1+((2)/(1+((5)/(x))))))=4', postfija: '81215x/+/+/4=', latex: '\\frac{8}{1+\\frac{2}{1+\\frac{5}{x}}}=4' },
  { infija: '39=pot2(x)-10', postfija: '39xpot210-=', latex: '39=x^2-10' },
  { infija: '5=12-x', postfija: '512x-=', latex: '5=12-x' },
  { infija: '((4*(x+5))/(3))=4', postfija: '4x5+*3/4=', latex: '\\frac{4\\cdot(x+5)}{3}=4' },
  { infija: '((pot2(x)+9)/(5))=1', postfija: 'xpot29+5/1=', latex: '\\frac{x^2+9}{5}=1' },
  { infija: 'pot3(x)+1=28', postfija: 'xpot31+28=', latex: 'x^3+1=28' },
  { infija: '9=raiz2(neg(x)+15)', postfija: '9xneg15+raiz2=', latex: '9=\\sqrt{-x+15}' },
  { infija: 'x+16=9', postfija: 'x16+9=', latex: 'x+16=9' },
  { infija: '7=neg(2*x)+6', postfija: '72x*neg6+=', latex: '7=-(2\\cdot x)+6' },
  { infija: '((neg(15))/(x-2))=5', postfija: '15negx2-/5=', latex: '\\frac{-15}{x-2}=5' },
  { infija: '((20)/(1+((12)/(1+((14)/(x))))))=4', postfija: '20112114x/+/+/4=', latex: '\\frac{20}{1+\\frac{12}{1+\\frac{14}{x}}}=4' },
  { infija: 'neg(5*x)=30', postfija: '5x*neg30=', latex: '-(5\\cdot x)=30' },
  { infija: 'raiz2(x+25)=10', postfija: 'x25+raiz210=', latex: '\\sqrt{x+25}=10' },
  { infija: '5=12+x', postfija: '512x+=', latex: '5=12+x' },
  { infija: '((8*pot2(x)+3)/(5))=1', postfija: '8xpot2*3+5/1=', latex: '\\frac{8\\cdot x^2+3}{5}=1' },
  { infija: 'pot3(x)-100=25', postfija: 'xpot3100-25=', latex: 'x^3-100=25' },
  { infija: '((120)/(x+10))=20', postfija: '120x10+/20=', latex: '\\frac{120}{x+10}=20' },
  { infija: '((neg(24))/(pot2(x)-13))=neg(2)', postfija: '24negxpot213-/2neg=', latex: '\\frac{-24}{x^2-13}=-2' },
  { infija: 'neg(10)=pot3(x)-2', postfija: '10negxpot32-=', latex: '-10=x^3-2' },
  { infija: 'neg(2)*(x+5)=12', postfija: '2negx5+*12=', latex: '-2\\cdot(x+5)=12' },
  { infija: 'neg(1)=raiz2(1+raiz2(x))-2', postfija: '1neg1xraiz2+raiz22-=', latex: '-1=\\sqrt{1+\\sqrt{x}}-2' },
  { infija: '25*pot2(x)+8=9', postfija: '25xpot2*8+9=', latex: '25\\cdot x^2+8=9' },
  { infija: '((55)/(x))+30=41', postfija: '55x/30+41=', latex: '\\frac{55}{x}+30=41' },
  { infija: 'raiz3(((40)/(neg(x)+1)))=2', postfija: '40xneg1+/raiz32=', latex: '\\sqrt[3]{\\frac{40}{-x+1}}=2' },
  { infija: '7=2*x+6', postfija: '72x*6+=', latex: '7=2\\cdot x+6' },
  { infija: 'pot2(x+7)+10=74', postfija: 'x7+pot210+74=', latex: '(x+7)^2+10=74' },
];

async function seedFinalEquations() {
  console.log('🌱 Poblando base de datos con ecuaciones definitivas...\n');

  try {
    console.log('📝 Creando 40 ecuaciones definitivas...');
    const createdEquations: Array<{ id: string }> = [];

    for (let i = 0; i < defaultEquations.length; i++) {
      const eq = defaultEquations[i];
      const equation = await prisma.equation.create({
        data: {
          postfixExpression: eq.postfija,
          infixExpression: eq.infija,
          latexExpression: eq.latex,
          isDefault: true,
          creatorId: null,
        },
      });
      createdEquations.push(equation);
      console.log(`   ${(i + 1).toString().padStart(2, '0')}. ${eq.infija}`);
    }

    console.log(`\n✅ ${createdEquations.length} ecuaciones creadas exitosamente\n`);

    console.log('👥 Asignando ecuaciones a usuarios...');
    const users = await prisma.user.findMany();
    console.log(`📊 Encontrados ${users.length} usuarios\n`);

    let totalAsignaciones = 0;
    for (const user of users) {
      for (const equation of createdEquations) {
        await prisma.userEquation.create({
          data: {
            userId: user.id,
            equationId: equation.id,
            status: 'NOT_STARTED',
            origin: 'DEFAULT',
            isActive: true,
          },
        });
        totalAsignaciones++;
      }
      console.log(`   ✅ ${createdEquations.length} ecuaciones asignadas a: ${user.email}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log(`📊 Resumen:`);
    console.log(`   - ${createdEquations.length} ecuaciones por defecto creadas`);
    console.log(`   - ${users.length} usuarios en el sistema`);
    console.log(`   - ${totalAsignaciones} asignaciones totales realizadas`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error al poblar ecuaciones:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedFinalEquations();
