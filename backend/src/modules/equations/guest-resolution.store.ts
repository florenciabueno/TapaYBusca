import { EquationStatus } from './equation.types.js';
import { RESOLUTION_STEP_NO_BRANCH } from './equation-solver/resolution-constants.js';

const GUEST_SESSION_TTL_MS = 1000 * 60 * 60 * 24;

type GuestEquationSource = {
  id: string;
  infixExpression?: string | null;
  postfixExpression?: string | null;
  latexExpression?: string | null;
  solutionValues?: unknown;
};

type GuestResolutionRow = {
  id: string;
  userEquationId: string;
  resolutionSessionId: number;
  subEquation: string;
  subEquationInfix?: string | null;
  proposedResult: string;
  resultValue: string;
  createdAt: Date;
  stepWithoutSolution: boolean;
  isCorrect: boolean;
  isVariable: boolean;
  resolutionSide: number;
};

type GuestEquationState = {
  id: string;
  userId: string;
  equationId: string;
  status: EquationStatus;
  currentResolutionId: number;
  selectedBranch: string;
  updatedAt: Date;
  equation: {
    infixExpression?: string | null;
    postfixExpression?: string | null;
    latexExpression?: string | null;
    solutionValues?: unknown;
  };
  resolutions: GuestResolutionRow[];
  stepCounter: number;
};

type GuestSessionState = {
  touchedAt: number;
  equations: Map<string, GuestEquationState>;
};

type ResolutionStateUpdate = {
  status?: EquationStatus;
  currentResolutionId?: number;
  selectedBranch?: string;
};

type ResolutionCreateInput = {
  userEquationId: string;
  resolutionSessionId: number;
  subEquation: string;
  subEquationInfix?: string | null;
  proposedResult: string;
  resultValue: string;
  stepWithoutSolution: boolean;
  isCorrect: boolean;
  isVariable: boolean;
  resolutionSide: number;
};

export class GuestResolutionStore {
  private sessions = new Map<string, GuestSessionState>();
  private userEquationToSession = new Map<string, { guestSessionId: string; equationId: string }>();

  ensureGuestEquation(guestSessionId: string, equation: GuestEquationSource): string {
    this.pruneExpiredSessions();
    const session = this.getOrCreateSession(guestSessionId);
    const existing = session.equations.get(equation.id);
    if (existing) {
      session.touchedAt = Date.now();
      existing.updatedAt = new Date();
      return existing.id;
    }

    const userEquationId = this.buildUserEquationId(guestSessionId, equation.id);
    const next: GuestEquationState = {
      id: userEquationId,
      userId: guestSessionId,
      equationId: equation.id,
      status: EquationStatus.NOT_STARTED,
      currentResolutionId: 0,
      selectedBranch: '',
      updatedAt: new Date(),
      equation: {
        infixExpression: equation.infixExpression ?? equation.postfixExpression ?? '',
        postfixExpression: equation.postfixExpression ?? equation.infixExpression ?? '',
        latexExpression: equation.latexExpression ?? equation.infixExpression ?? equation.postfixExpression ?? '',
        solutionValues: equation.solutionValues ?? [],
      },
      resolutions: [],
      stepCounter: 0,
    };
    session.equations.set(equation.id, next);
    this.userEquationToSession.set(userEquationId, { guestSessionId, equationId: equation.id });
    return userEquationId;
  }

  getGuestEquationState(guestSessionId: string, equationId: string): GuestEquationState | null {
    this.pruneExpiredSessions();
    const session = this.sessions.get(guestSessionId);
    if (!session) return null;
    session.touchedAt = Date.now();
    return session.equations.get(equationId) ?? null;
  }

  findByIdWithEquation(userEquationId: string) {
    const state = this.getStateByUserEquationId(userEquationId);
    if (!state) return null;
    return this.toPublicState(state);
  }

  async getMaxResolutionSessionId(userEquationId: string): Promise<number> {
    const state = this.getStateByUserEquationId(userEquationId);
    if (!state || state.resolutions.length === 0) return 0;
    return Math.max(...state.resolutions.map((item) => item.resolutionSessionId));
  }

  async updateResolutionState(userEquationId: string, data: ResolutionStateUpdate) {
    const state = this.getStateByUserEquationId(userEquationId);
    if (!state) throw new Error('Ecuación guest no encontrada');
    if (data.status !== undefined) state.status = data.status;
    if (data.currentResolutionId !== undefined) state.currentResolutionId = data.currentResolutionId;
    if (data.selectedBranch !== undefined) state.selectedBranch = data.selectedBranch;
    state.updatedAt = new Date();
    return this.toPublicState(state);
  }

  async createResolution(data: ResolutionCreateInput) {
    const state = this.getStateByUserEquationId(data.userEquationId);
    if (!state) throw new Error('Ecuación guest no encontrada');
    const nextId = ++state.stepCounter;
    const row: GuestResolutionRow = {
      id: String(nextId),
      userEquationId: data.userEquationId,
      resolutionSessionId: data.resolutionSessionId,
      subEquation: data.subEquation,
      subEquationInfix: data.subEquationInfix ?? null,
      proposedResult: data.proposedResult,
      resultValue: data.resultValue,
      createdAt: new Date(),
      stepWithoutSolution: data.stepWithoutSolution,
      isCorrect: data.isCorrect,
      isVariable: data.isVariable,
      resolutionSide: data.resolutionSide,
    };
    state.resolutions.push(row);
    state.updatedAt = new Date();
    return row;
  }

  async findResolutionsByUserEquation(userEquationId: string, resolutionSessionId: number) {
    const state = this.getStateByUserEquationId(userEquationId);
    if (!state) return [];
    return state.resolutions
      .filter((item) => item.resolutionSessionId === resolutionSessionId)
      .sort((a, b) => Number(a.id) - Number(b.id));
  }

  async getDistinctLoggedSolutions(userEquationId: string, resolutionSessionId: number): Promise<number[]> {
    const state = this.getStateByUserEquationId(userEquationId);
    if (!state) return [];
    const values = new Set<number>();
    for (const row of state.resolutions) {
      if (row.resolutionSessionId !== resolutionSessionId || !row.isVariable || !row.isCorrect) continue;
      const tokens = row.resultValue.split(';').filter(Boolean);
      for (const token of tokens) {
        const value = Number(token.trim());
        if (!Number.isNaN(value) && Number.isFinite(value)) values.add(value);
      }
    }
    return [...values];
  }

  async countEmptySolutionWrongNumericAttempts(userEquationId: string, resolutionSessionId: number): Promise<number> {
    const state = this.getStateByUserEquationId(userEquationId);
    if (!state) return 0;
    return state.resolutions.filter(
      (item) =>
        item.resolutionSessionId === resolutionSessionId &&
        item.stepWithoutSolution &&
        !item.isCorrect &&
        item.resolutionSide === RESOLUTION_STEP_NO_BRANCH
    ).length;
  }

  async getPreviousStep(
    userEquationId: string,
    resolutionSessionId: number,
    bifurcoResolucion: boolean,
    statusResolucion: number
  ) {
    const BIFURCO = 2;
    const NO_BIFURCO = 1;
    const state = this.getStateByUserEquationId(userEquationId);
    if (!state) return null;
    const inSession = state.resolutions
      .filter((item) => item.resolutionSessionId === resolutionSessionId && item.isCorrect)
      .sort((a, b) => Number(a.id) - Number(b.id));

    if (bifurcoResolucion) {
      const candidates = inSession.filter((item) => item.resolutionSide === BIFURCO);
      return candidates[candidates.length - 1] ?? null;
    }

    if (statusResolucion === BIFURCO) {
      const bifurcoStep = [...inSession].reverse().find((item) => item.resolutionSide === BIFURCO);
      if (!bifurcoStep) return null;
      return (
        [...inSession]
          .reverse()
          .find(
            (item) =>
              item.resolutionSide === NO_BIFURCO &&
              !item.isVariable &&
              Number(item.id) < Number(bifurcoStep.id)
          ) ?? null
      );
    }

    return [...inSession].reverse().find((item) => item.resolutionSide === NO_BIFURCO && !item.isVariable) ?? null;
  }

  async canUserModify(userEquationId: string, userId: string): Promise<boolean> {
    const state = this.getStateByUserEquationId(userEquationId);
    return state?.userId === userId;
  }

  async deleteResolutionsByUserEquation(userEquationId: string) {
    const state = this.getStateByUserEquationId(userEquationId);
    if (!state) return { count: 0 };
    const count = state.resolutions.length;
    state.resolutions = [];
    state.stepCounter = 0;
    state.updatedAt = new Date();
    return { count };
  }

  private toPublicState(state: GuestEquationState) {
    return {
      id: state.id,
      userId: state.userId,
      equationId: state.equationId,
      status: state.status,
      currentResolutionId: state.currentResolutionId,
      selectedBranch: state.selectedBranch,
      updatedAt: state.updatedAt,
      equation: state.equation,
    };
  }

  private getOrCreateSession(guestSessionId: string): GuestSessionState {
    const existing = this.sessions.get(guestSessionId);
    if (existing) {
      existing.touchedAt = Date.now();
      return existing;
    }
    const created: GuestSessionState = {
      touchedAt: Date.now(),
      equations: new Map(),
    };
    this.sessions.set(guestSessionId, created);
    return created;
  }

  private buildUserEquationId(guestSessionId: string, equationId: string): string {
    return `guest:${guestSessionId}:${equationId}`;
  }

  private getStateByUserEquationId(userEquationId: string): GuestEquationState | null {
    this.pruneExpiredSessions();
    const relation = this.userEquationToSession.get(userEquationId);
    if (!relation) return null;
    const session = this.sessions.get(relation.guestSessionId);
    if (!session) return null;
    session.touchedAt = Date.now();
    return session.equations.get(relation.equationId) ?? null;
  }

  private pruneExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, state] of this.sessions.entries()) {
      if (now - state.touchedAt <= GUEST_SESSION_TTL_MS) continue;
      for (const equationState of state.equations.values()) {
        this.userEquationToSession.delete(equationState.id);
      }
      this.sessions.delete(sessionId);
    }
  }
}
