import { CreateEquationDto, UpdateEquationDto, EquationStatus, EquationOrigin, Equation } from '../types/equation.types.js';

// Mock data - simulando ecuaciones en memoria
const mockEquations: Equation[] = [
  {
    id: '1',
    equation: '2x + 5 = 13',
    origin: EquationOrigin.DEFECTO,
    status: EquationStatus.SIN_COMENZAR,
    steps: 0,
    userId: null,
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-02-10'),
  },
  {
    id: '2',
    equation: 'x² - 4x + 4 = 0',
    origin: EquationOrigin.DEFECTO,
    status: EquationStatus.SIN_COMENZAR,
    steps: 0,
    userId: null,
    createdAt: new Date('2026-02-09'),
    updatedAt: new Date('2026-02-09'),
  },
  {
    id: '3',
    equation: '3(x + 2) = 15',
    origin: EquationOrigin.DEFECTO,
    status: EquationStatus.EN_PROCESO,
    steps: 2,
    userId: null,
    createdAt: new Date('2026-02-08'),
    updatedAt: new Date('2026-02-10'),
  },
  {
    id: '4',
    equation: '√(x + 9) = 5',
    origin: EquationOrigin.DEFECTO,
    status: EquationStatus.RESUELTA,
    steps: 4,
    userId: null,
    createdAt: new Date('2026-02-07'),
    updatedAt: new Date('2026-02-09'),
  },
  {
    id: '5',
    equation: '(x + 3)(x - 2) = 0',
    origin: EquationOrigin.DEFECTO,
    status: EquationStatus.RESUELTA,
    steps: 2,
    userId: null,
    createdAt: new Date('2026-02-06'),
    updatedAt: new Date('2026-02-08'),
  },
  {
    id: '6',
    equation: '5x - 3 = 2x + 9',
    origin: EquationOrigin.DEFECTO,
    status: EquationStatus.EN_PROCESO,
    steps: 2,
    userId: null,
    createdAt: new Date('2026-02-05'),
    updatedAt: new Date('2026-02-09'),
  },
  {
    id: '7',
    equation: 'x³ - 8 = 0',
    origin: EquationOrigin.DEFECTO,
    status: EquationStatus.SIN_COMENZAR,
    steps: 0,
    userId: null,
    createdAt: new Date('2026-02-04'),
    updatedAt: new Date('2026-02-04'),
  },
  {
    id: '8',
    equation: '|2x - 4| = 6',
    origin: EquationOrigin.DEFECTO,
    status: EquationStatus.RESUELTA,
    steps: 3,
    userId: null,
    createdAt: new Date('2026-02-03'),
    updatedAt: new Date('2026-02-07'),
  },
];

export class EquationRepository {
  private equations: Equation[] = [...mockEquations];

  async findAll(userId?: string) {
    // Ordenar por status primero, luego por fecha de actualización (más reciente primero)
    const statusOrder = {
      [EquationStatus.SIN_COMENZAR]: 0,
      [EquationStatus.EN_PROCESO]: 1,
      [EquationStatus.RESUELTA]: 2,
    };

    return [...this.equations].sort((a, b) => {
      // Primero ordenar por estado
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      
      // Luego por fecha de actualización (más reciente primero)
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }

  async findById(id: string) {
    return this.equations.find(eq => eq.id === id) || null;
  }

  async create(data: CreateEquationDto) {
    const newEquation: Equation = {
      id: Math.random().toString(36).substring(7),
      equation: data.equation,
      origin: data.origin || EquationOrigin.MANUAL,
      status: EquationStatus.SIN_COMENZAR,
      steps: 0,
      userId: data.userId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.equations.push(newEquation);
    return newEquation;
  }

  async update(id: string, data: UpdateEquationDto) {
    const equation = this.equations.find(eq => eq.id === id);
    if (!equation) throw new Error('Ecuación no encontrada');

    Object.assign(equation, {
      ...data,
      updatedAt: new Date(),
    });

    return equation;
  }

  async delete(id: string) {
    const index = this.equations.findIndex(eq => eq.id === id);
    if (index === -1) throw new Error('Ecuación no encontrada');
    
    const deleted = this.equations[index];
    this.equations.splice(index, 1);
    return deleted;
  }

  async canUserModify(equationId: string, userId: string): Promise<boolean> {
    const equation = this.equations.find(eq => eq.id === equationId);
    if (!equation) return false;
    
    // El usuario puede modificar si es su ecuación o si no es de tipo DEFECTO
    return equation.userId === userId && equation.origin !== EquationOrigin.DEFECTO;
  }
}
