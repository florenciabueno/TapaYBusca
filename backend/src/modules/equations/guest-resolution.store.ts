import {
  CreateResolutionInput,
  DefaultEquationRow,
  EquationStatus,
  ResolutionStateUpdate,
  StoredEquationSnapshot,
} from './equation.types.js';
import {
  RESOLUTION_STEP_BRANCH,
  RESOLUTION_STEP_NO_BRANCH,
} from './equation-solver/resolution-constants.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
/** Inactivity window; does not survive process restarts (e.g. Render cold start). */
const GUEST_SESSION_TTL_MS = MS_PER_DAY * 7;
/** Cap simultaneous guest sessions in RAM; overflow evicts least recently used sessions. */
const MAX_GUEST_SESSIONS = 2_000;
/** When Node heap used exceeds this, evict a batch of oldest sessions (best-effort). */
const GUEST_HEAP_PRESSURE_BYTES = 384 * 1024 * 1024;
const HEAP_PRESSURE_EVICTION_BATCH = 50;

type GuestResolutionRow = CreateResolutionInput & {
  id: string;
  createdAt: Date;
};

type GuestEquationState = {
  id: string;
  userId: string;
  equationId: string;
  status: EquationStatus;
  currentResolutionId: number;
  selectedBranch: string;
  updatedAt: Date;
  equation: StoredEquationSnapshot;
  resolutions: GuestResolutionRow[];
  stepCounter: number;
};

type GuestSessionState = {
  touchedAt: number;
  equations: Map<string, GuestEquationState>;
};

export class GuestResolutionStore {
  private sessions = new Map<string, GuestSessionState>();
  private userEquationToSession = new Map<string, { guestSessionId: string; equationId: string }>();

  ensureGuestEquation(guestSessionId: string, equation: DefaultEquationRow): string {
    this.maintainGuestSessions(guestSessionId);
    const session = this.getOrCreateSession(guestSessionId);
    const existing = session.equations.get(equation.id);
    if (existing) {
      this.touchSession(session);
      existing.updatedAt = new Date();
      return existing.id;
    }

    return this.registerGuestEquation(session, guestSessionId, equation);
  }

  getGuestEquationState(guestSessionId: string, equationId: string): GuestEquationState | null {
    this.maintainGuestSessions(guestSessionId);
    const session = this.sessions.get(guestSessionId);
    if (!session) return null;
    session.touchedAt = Date.now();
    return session.equations.get(equationId) ?? null;
  }

  async findByIdWithEquation(userEquationId: string) {
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

  async createResolution(data: CreateResolutionInput) {
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
    lookupBranchStep: boolean,
    currentStepSide: number
  ) {
    const state = this.getStateByUserEquationId(userEquationId);
    if (!state) return null;
    const inSession = state.resolutions
      .filter((item) => item.resolutionSessionId === resolutionSessionId && item.isCorrect)
      .sort((a, b) => Number(a.id) - Number(b.id));

    if (lookupBranchStep) {
      const candidates = inSession.filter((item) => item.resolutionSide === RESOLUTION_STEP_BRANCH);
      return candidates[candidates.length - 1] ?? null;
    }

    if (currentStepSide === RESOLUTION_STEP_BRANCH) {
      const branchStep = [...inSession]
        .reverse()
        .find((item) => item.resolutionSide === RESOLUTION_STEP_BRANCH);
      if (!branchStep) return null;
      return (
        [...inSession]
          .reverse()
          .find(
            (item) =>
              item.resolutionSide === RESOLUTION_STEP_NO_BRANCH &&
              !item.isVariable &&
              Number(item.id) < Number(branchStep.id)
          ) ?? null
      );
    }

    return (
      [...inSession]
        .reverse()
        .find((item) => item.resolutionSide === RESOLUTION_STEP_NO_BRANCH && !item.isVariable) ?? null
    );
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
      this.touchSession(existing);
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

  private touchSession(session: GuestSessionState): void {
    session.touchedAt = Date.now();
  }

  private buildStoredEquation(source: DefaultEquationRow): StoredEquationSnapshot {
    const infix = source.infixExpression ?? source.postfixExpression ?? '';
    const postfix = source.postfixExpression ?? source.infixExpression ?? '';
    return {
      infixExpression: infix,
      postfixExpression: postfix,
      latexExpression: source.latexExpression ?? infix ?? postfix,
      solutionValues: source.solutionValues ?? [],
    };
  }

  private createGuestEquationState(
    guestSessionId: string,
    equation: DefaultEquationRow
  ): GuestEquationState {
    const userEquationId = this.buildUserEquationId(guestSessionId, equation.id);
    return {
      id: userEquationId,
      userId: guestSessionId,
      equationId: equation.id,
      status: EquationStatus.NOT_STARTED,
      currentResolutionId: 0,
      selectedBranch: '',
      updatedAt: new Date(),
      equation: this.buildStoredEquation(equation),
      resolutions: [],
      stepCounter: 0,
    };
  }

  private registerGuestEquation(
    session: GuestSessionState,
    guestSessionId: string,
    equation: DefaultEquationRow
  ): string {
    const state = this.createGuestEquationState(guestSessionId, equation);
    session.equations.set(equation.id, state);
    this.userEquationToSession.set(state.id, { guestSessionId, equationId: equation.id });
    return state.id;
  }

  private getStateByUserEquationId(userEquationId: string): GuestEquationState | null {
    const relation = this.userEquationToSession.get(userEquationId);
    if (!relation) return null;
    this.maintainGuestSessions(relation.guestSessionId);
    const session = this.sessions.get(relation.guestSessionId);
    if (!session) return null;
    this.touchSession(session);
    return session.equations.get(relation.equationId) ?? null;
  }

  private maintainGuestSessions(protectSessionId?: string): void {
    this.pruneExpiredSessions();
    while (this.sessions.size >= MAX_GUEST_SESSIONS) {
      if (!this.evictOldestSession(protectSessionId)) break;
    }
    if (this.isUnderHeapPressure()) {
      for (let i = 0; i < HEAP_PRESSURE_EVICTION_BATCH && this.isUnderHeapPressure(); i++) {
        if (!this.evictOldestSession(protectSessionId)) break;
      }
    }
  }

  private isUnderHeapPressure(): boolean {
    return process.memoryUsage().heapUsed > GUEST_HEAP_PRESSURE_BYTES;
  }

  private pruneExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, state] of this.sessions.entries()) {
      if (now - state.touchedAt <= GUEST_SESSION_TTL_MS) continue;
      this.deleteSession(sessionId, state);
    }
  }

  private evictOldestSession(exceptSessionId?: string): boolean {
    let oldestId: string | null = null;
    let oldestTouch = Number.POSITIVE_INFINITY;
    for (const [sessionId, state] of this.sessions.entries()) {
      if (sessionId === exceptSessionId) continue;
      if (state.touchedAt < oldestTouch) {
        oldestTouch = state.touchedAt;
        oldestId = sessionId;
      }
    }
    if (!oldestId) return false;
    const session = this.sessions.get(oldestId);
    if (!session) return false;
    this.deleteSession(oldestId, session);
    return true;
  }

  private deleteSession(sessionId: string, session: GuestSessionState): void {
    for (const equationState of session.equations.values()) {
      this.userEquationToSession.delete(equationState.id);
    }
    this.sessions.delete(sessionId);
  }
}
