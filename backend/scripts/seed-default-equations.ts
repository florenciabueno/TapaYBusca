import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 40 ecuaciones definitivas con notación normal e infija
const ecuacionesDefinitivas = [
  { normal: 'x+5=12', postfija: 'x5+12=' },
  { normal: '2*(x+5)=12', postfija: '2x5+*12=' },
  { normal: '((150)/(x+10))=30', postfija: '150x10+/30=' },
  { normal: 'raiz2(x+5)=4', postfija: 'x5+raiz24=' },
  { normal: '25=pot2(x)', postfija: '25xpot2=' },
  { normal: 'pot2(x+2)+10=26', postfija: 'x2+pot210+26=' },
  { normal: 'raiz3(((40)/(x+1)))=2', postfija: '40x1+/raiz32=' },
  { normal: '20=84-pot3(x)', postfija: '2084xpot3-=' },
  { normal: '((360)/(pot2(x)-13))=10', postfija: '360xpot213-/10=' },
  { normal: 'x+15=10', postfija: 'x15+10=' },
  { normal: '2*x+9=7', postfija: '2x*9+7=' },
  { normal: '10=3*x+4', postfija: '103x*4+=' },
  { normal: '9=raiz2(1+raiz2(x))', postfija: '91xraiz2+raiz2=' },
  { normal: '3=((15)/(x+2))', postfija: '315x2+/=' },
  { normal: '((8)/(1+((2)/(1+((5)/(x))))))=4', postfija: '81215x/+/+/4=' },
  { normal: '39=pot2(x)-10', postfija: '39xpot210-=' },
  { normal: '5=12-x', postfija: '512x-=' },
  { normal: '((4*(x+5))/(3))=4', postfija: '4x5+*3/4=' },
  { normal: '((pot2(x)+9)/(5))=1', postfija: 'xpot29+5/1=' },
  { normal: 'pot3(x)+1=28', postfija: 'xpot31+28=' },
  { normal: '9=raiz2(neg(x)+15)', postfija: '9xneg15+raiz2=' },
  { normal: 'x+16=9', postfija: 'x16+9=' },
  { normal: '7=neg(2*x)+6', postfija: '72x*neg6+=' },
  { normal: '((neg(15))/(x-2))=5', postfija: '15negx2-/5=' },
  { normal: '((20)/(1+((12)/(1+((14)/(x))))))=4', postfija: '20112114x/+/+/4=' },
  { normal: 'neg(5*x)=30', postfija: '5x*neg30=' },
  { normal: 'raiz2(x+25)=10', postfija: 'x25+raiz210=' },
  { normal: '5=12+x', postfija: '512x+=' },
  { normal: '((8*pot2(x)+3)/(5))=1', postfija: '8xpot2*3+5/1=' },
  { normal: 'pot3(x)-100=25', postfija: 'xpot3100-25=' },
  { normal: '((120)/(x+10))=20', postfija: '120x10+/20=' },
  { normal: '((neg(24))/(pot2(x)-13))=neg(2)', postfija: '24negxpot213-/2neg=' },
  { normal: 'neg(10)=pot3(x)-2', postfija: '10negxpot32-=' },
  { normal: 'neg(2)*(x+5)=12', postfija: '2negx5+*12=' },
  { normal: 'neg(1)=raiz2(1+raiz2(x))-2', postfija: '1neg1xraiz2+raiz22-=' },
  { normal: '25*pot2(x)+8=9', postfija: '25xpot2*8+9=' },
  { normal: '((55)/(x))+30=41', postfija: '55x/30+41=' },
  { normal: 'raiz3(((40)/(neg(x)+1)))=2', postfija: '40xneg1+/raiz32=' },
  { normal: '7=2*x+6', postfija: '72x*6+=' },
  { normal: 'pot2(x+7)+10=74', postfija: 'x7+pot210+74=' },
];

async function seedFinalEquations() {
  console.log('🌱 Poblando base de datos con ecuaciones definitivas...\n');

  try {
    // Crear las 40 ecuaciones definitivas
    console.log('📝 Creando 40 ecuaciones definitivas...');
    const ecuacionesCreadas = [];

    for (let i = 0; i < ecuacionesDefinitivas.length; i++) {
      const eq = ecuacionesDefinitivas[i];
      const ecuacion = await prisma.ecuacion.create({
        data: {
          expresionPostfija: eq.postfija,
          porDefecto: true,
          idCreador: null,
        },
      });
      ecuacionesCreadas.push(ecuacion);
      console.log(`   ${(i + 1).toString().padStart(2, '0')}. ${eq.normal}`);
    }

    console.log(`\n✅ ${ecuacionesCreadas.length} ecuaciones creadas exitosamente\n`);

    // Asignar ecuaciones a todos los usuarios existentes
    console.log('👥 Asignando ecuaciones a usuarios...');
    const usuarios = await prisma.user.findMany();
    console.log(`📊 Encontrados ${usuarios.length} usuarios\n`);

    let totalAsignaciones = 0;
    for (const usuario of usuarios) {
      for (const ecuacion of ecuacionesCreadas) {
        await prisma.ecuacionUsuario.create({
          data: {
            usuarioId: usuario.id,
            ecuacionId: ecuacion.id,
            estado: 'SIN_COMENZAR',
            origen: 'POR_DEFECTO',
            activa: true,
          },
        });
        totalAsignaciones++;
      }
      console.log(`   ✅ ${ecuacionesCreadas.length} ecuaciones asignadas a: ${usuario.email}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log(`📊 Resumen:`);
    console.log(`   - ${ecuacionesCreadas.length} ecuaciones por defecto creadas`);
    console.log(`   - ${usuarios.length} usuarios en el sistema`);
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
