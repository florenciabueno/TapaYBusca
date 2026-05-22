import { EquationStatus } from './equation.types.js';
import { EquationRepository } from './equation.repository.js';
import { ResolutionService } from './resolution.service.js';
import { GuestResolutionStore } from './guest-resolution.store.js';
import { RESOLUTION_CODES } from './equation-solver/resolution-constants.js';

type ResolveStepPayload = {
  subEquationInfix?: string;
  answer: string;
  resolutionStepStatus: number;
};

const MESSAGE_EQUATION_NOT_FOUND = 'Ecuación no encontrada.';

export class GuestResolutionService {
  private resolutionService: ResolutionService;

  constructor(
    private equationRepository: EquationRepository,
    private guestResolutionStore: GuestResolutionStore = new GuestResolutionStore()
  ) {
    this.resolutionService = new ResolutionService(
      this.guestResolutionStore as unknown as EquationRepository
    );
  }

  async getGuestEquationById(
    equationId: string,
    guestSessionId: string
  ): Promise<{ status: EquationStatus; steps: number; updatedAt: Date } | null> {
    const userEquationId = await this.ensureGuestEquationSession(equationId, guestSessionId);
    if (!userEquationId) return null;
    const sessionState = await this.guestResolutionStore.findByIdWithEquation(userEquationId);
    if (!sessionState) return null;
    const steps = await this.guestResolutionStore.findResolutionsByUserEquation(
      userEquationId,
      sessionState.currentResolutionId ?? 0
    );
    return {
      status: sessionState.status as EquationStatus,
      steps: steps.length,
      updatedAt: sessionState.updatedAt ? new Date(sessionState.updatedAt) : new Date(),
    };
  }

  async resolveStep(
    equationId: string,
    guestSessionId: string,
    payload: ResolveStepPayload
  ): Promise<{ code: string; message?: string }> {
    const userEquationId = await this.ensureGuestEquationSession(equationId, guestSessionId);
    if (!userEquationId) {
      return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: MESSAGE_EQUATION_NOT_FOUND };
    }
    return this.resolutionService.resolveStep(userEquationId, guestSessionId, payload);
  }

  async getResolution(equationId: string, guestSessionId: string) {
    const userEquationId = await this.ensureGuestEquationSession(equationId, guestSessionId);
    if (!userEquationId) return null;
    return this.resolutionService.getResolution(userEquationId, guestSessionId);
  }

  async finishResolution(
    equationId: string,
    guestSessionId: string
  ): Promise<{ code: string; message?: string }> {
    const userEquationId = await this.ensureGuestEquationSession(equationId, guestSessionId);
    if (!userEquationId) {
      return { code: RESOLUTION_CODES.SYNTAX_INCORRECT, message: MESSAGE_EQUATION_NOT_FOUND };
    }
    return this.resolutionService.finishResolution(userEquationId, guestSessionId);
  }

  async resetResolution(equationId: string, guestSessionId: string): Promise<boolean> {
    const userEquationId = await this.ensureGuestEquationSession(equationId, guestSessionId);
    if (!userEquationId) return false;
    return this.resolutionService.resetResolution(userEquationId, guestSessionId);
  }

  private async ensureGuestEquationSession(
    equationId: string,
    guestSessionId: string
  ): Promise<string | null> {
    const equation = await this.equationRepository.findDefaultEquationById(equationId);
    if (!equation) return null;
    return this.guestResolutionStore.ensureGuestEquation(guestSessionId, equation);
  }
}
