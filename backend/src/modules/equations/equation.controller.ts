import { Request, Response } from 'express';
import { EquationService } from './equation.service.js';
import { ResolutionService } from './resolution.service.js';
import {
  getErrorMessage,
  isPermissionError,
  isValidationError,
  parseCreateEquationBody,
  parseDateFilters,
  parseDownloadBody,
  parseOriginsQuery,
  parsePageAndLimit,
  parseGuestSessionId,
  parseRequiredIdParam,
  parseResolveStepBody,
  parseStatusesQuery,
  parseUpdateEquationBody,
  parseUploadEquationsBody,
  parseUserListStatusesQuery,
} from './equation.controller.helpers.js';
import { GuestResolutionService } from './guest-resolution.service.js';

const ERROR_GET_EQUATIONS = 'Error al obtener ecuaciones';
const ERROR_EQUATION_NOT_FOUND = 'Ecuación no encontrada';
const ERROR_GET_EQUATION = 'Error al obtener la ecuacion';
const ERROR_CREATE_EQUATION = 'Error al crear la ecuacion';
const ERROR_UPDATE_EQUATION = 'Error al actualizar la ecuacion';
const ERROR_DELETE_EQUATION = 'Error al eliminar la ecuacion';
const ERROR_GET_FOR_UPLOAD = 'Error al obtener ecuaciones para subir';
const ERROR_UPLOAD_EQUATIONS = 'Error al subir ecuaciones';
const ERROR_DOWNLOAD_EQUATIONS = 'Error al descargar ecuaciones';
const ERROR_RESOLVE_STEP = 'Error al validar el paso';
const ERROR_GET_RESOLUTION = 'Error al obtener la resolucion';
const ERROR_RESET_RESOLUTION = 'Error al reiniciar la resolucion';
const ERROR_FINISH_RESOLUTION = 'Error al finalizar la resolucion';

export class EquationController {
  constructor(
    private equationService: EquationService,
    private resolutionService: ResolutionService,
    private guestResolutionService: GuestResolutionService
  ) {}

  getPublicEquations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit } = parsePageAndLimit(req.query);
      const statuses = parseStatusesQuery(req.query);
      const dateFilters = parseDateFilters(req.query);
      if ('error' in dateFilters) {
        res.status(400).json({ error: dateFilters.error });
        return;
      }

      const result = await this.equationService.getPublicEquations(
        page,
        limit,
        statuses,
        dateFilters.fromDate,
        dateFilters.toDate
      );
      res.status(200).json(result);
    } catch (error: unknown) {
      res.status(500).json({
        error: getErrorMessage(error, ERROR_GET_EQUATIONS),
      });
    }
  };

  getAllEquations = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { page, limit } = parsePageAndLimit(req.query);
      const origins = parseOriginsQuery(req.query);
      const { workflowStatuses, includeDeleted } = parseUserListStatusesQuery(req.query);
      const dateFilters = parseDateFilters(req.query);
      if ('error' in dateFilters) {
        res.status(400).json({ error: dateFilters.error });
        return;
      }

      const result = await this.equationService.getAllEquations(
        userId,
        page,
        limit,
        origins,
        workflowStatuses,
        dateFilters.fromDate,
        dateFilters.toDate,
        includeDeleted
      );
      res.status(200).json(result);
    } catch (error: unknown) {
      res.status(500).json({
        error: getErrorMessage(error, ERROR_GET_EQUATIONS),
      });
    }
  };

  getForUpload = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const result = await this.equationService.getEquationsForUpload(userId);
      res.status(200).json(result);
    } catch (error: unknown) {
      res.status(500).json({
        error: getErrorMessage(error, ERROR_GET_FOR_UPLOAD),
      });
    }
  };

  uploadEquations = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const dto = parseUploadEquationsBody(req.body);
      await this.equationService.uploadEquations(userId, dto.userEquationIds);
      res.status(200).json({ ok: true });
    } catch (error: unknown) {
      res.status(400).json({
        error: getErrorMessage(error, ERROR_UPLOAD_EQUATIONS),
      });
    }
  };

  downloadEquations = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const dto = parseDownloadBody(req.body);
      const result = await this.equationService.downloadEquations(userId, dto);
      res.status(200).json(result);
    } catch (error: unknown) {
      res.status(400).json({
        error: getErrorMessage(error, ERROR_DOWNLOAD_EQUATIONS),
      });
    }
  };

  getEquationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseRequiredIdParam(req.params);
      const equation = await this.equationService.getEquationById(id);
      if (!equation) {
        res.status(404).json({ error: ERROR_EQUATION_NOT_FOUND });
        return;
      }
      res.status(200).json(equation);
    } catch (error: unknown) {
      res.status(500).json({
        error: getErrorMessage(error, ERROR_GET_EQUATION),
      });
    }
  };

  getGuestEquationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const equationId = parseRequiredIdParam(req.params);
      const guestSessionId = parseGuestSessionId(req);
      const guestProgress = await this.guestResolutionService.getGuestEquationById(
        equationId,
        guestSessionId
      );
      if (!guestProgress) {
        res.status(404).json({ error: ERROR_EQUATION_NOT_FOUND });
        return;
      }
      const equation = await this.equationService.getPublicEquationById(equationId, {
        status: guestProgress.status,
        steps: guestProgress.steps,
        date: guestProgress.updatedAt,
      });
      if (!equation) {
        res.status(404).json({ error: ERROR_EQUATION_NOT_FOUND });
        return;
      }
      res.status(200).json(equation);
    } catch (error: unknown) {
      const status = isValidationError(error) ? 400 : 500;
      res.status(status).json({
        error: getErrorMessage(error, ERROR_GET_EQUATION),
      });
    }
  };

  createEquation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const data = parseCreateEquationBody(req.body, userId);
      const equation = await this.equationService.createEquation(data);
      res.status(201).json(equation);
    } catch (error: unknown) {
      res.status(400).json({
        error: getErrorMessage(error, ERROR_CREATE_EQUATION),
      });
    }
  };

  updateEquation = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseRequiredIdParam(req.params);
      const userId = req.userId!;
      const data = parseUpdateEquationBody(req.body);
      const equation = await this.equationService.updateEquation(id, data, userId);
      res.status(200).json(equation);
    } catch (error: unknown) {
      const status = isPermissionError(error) ? 403 : 400;
      res.status(status).json({
        error: getErrorMessage(error, ERROR_UPDATE_EQUATION),
      });
    }
  };

  deleteEquation = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseRequiredIdParam(req.params);
      const userId = req.userId!;
      await this.equationService.deleteEquation(id, userId);
      res.status(204).send();
    } catch (error: unknown) {
      const status = isPermissionError(error) ? 403 : 400;
      res.status(status).json({
        error: getErrorMessage(error, ERROR_DELETE_EQUATION),
      });
    }
  };

  resolveStep = async (req: Request, res: Response): Promise<void> => {
    try {
      const userEquationId = parseRequiredIdParam(req.params);
      const userId = req.userId!;
      const payload = parseResolveStepBody(req.body);
      const result = await this.resolutionService.resolveStep(userEquationId, userId, payload);
      res.status(200).json(result);
    } catch (error: unknown) {
      res.status(400).json({
        error: getErrorMessage(error, ERROR_RESOLVE_STEP),
      });
    }
  };

  guestResolveStep = async (req: Request, res: Response): Promise<void> => {
    try {
      const equationId = parseRequiredIdParam(req.params);
      const guestSessionId = parseGuestSessionId(req);
      const payload = parseResolveStepBody(req.body);
      const result = await this.guestResolutionService.resolveStep(
        equationId,
        guestSessionId,
        payload
      );
      res.status(200).json(result);
    } catch (error: unknown) {
      const status = isValidationError(error) ? 400 : 500;
      res.status(status).json({
        error: getErrorMessage(error, ERROR_RESOLVE_STEP),
      });
    }
  };

  getResolution = async (req: Request, res: Response): Promise<void> => {
    try {
      const userEquationId = parseRequiredIdParam(req.params);
      const userId = req.userId!;
      const data = await this.resolutionService.getResolution(userEquationId, userId);
      if (!data) {
        res.status(404).json({ error: ERROR_EQUATION_NOT_FOUND });
        return;
      }
      res.status(200).json(data);
    } catch (error: unknown) {
      res.status(500).json({
        error: getErrorMessage(error, ERROR_GET_RESOLUTION),
      });
    }
  };

  guestGetResolution = async (req: Request, res: Response): Promise<void> => {
    try {
      const equationId = parseRequiredIdParam(req.params);
      const guestSessionId = parseGuestSessionId(req);
      const data = await this.guestResolutionService.getResolution(equationId, guestSessionId);
      if (!data) {
        res.status(404).json({ error: ERROR_EQUATION_NOT_FOUND });
        return;
      }
      res.status(200).json(data);
    } catch (error: unknown) {
      const status = isValidationError(error) ? 400 : 500;
      res.status(status).json({
        error: getErrorMessage(error, ERROR_GET_RESOLUTION),
      });
    }
  };

  resetResolution = async (req: Request, res: Response): Promise<void> => {
    try {
      const userEquationId = parseRequiredIdParam(req.params);
      const userId = req.userId!;
      const ok = await this.resolutionService.resetResolution(userEquationId, userId);
      if (!ok) {
        res.status(403).json({ error: 'No tienes permisos para reiniciar esta ecuacion' });
        return;
      }
      res.status(200).json({ ok: true });
    } catch (error: unknown) {
      res.status(500).json({
        error: getErrorMessage(error, ERROR_RESET_RESOLUTION),
      });
    }
  };

  guestResetResolution = async (req: Request, res: Response): Promise<void> => {
    try {
      const equationId = parseRequiredIdParam(req.params);
      const guestSessionId = parseGuestSessionId(req);
      const ok = await this.guestResolutionService.resetResolution(equationId, guestSessionId);
      if (!ok) {
        res.status(403).json({ error: 'No tienes permisos para reiniciar esta ecuacion' });
        return;
      }
      res.status(200).json({ ok: true });
    } catch (error: unknown) {
      const status = isValidationError(error) ? 400 : 500;
      res.status(status).json({
        error: getErrorMessage(error, ERROR_RESET_RESOLUTION),
      });
    }
  };

  finishResolution = async (req: Request, res: Response): Promise<void> => {
    try {
      const userEquationId = parseRequiredIdParam(req.params);
      const userId = req.userId!;
      const result = await this.resolutionService.finishResolution(userEquationId, userId);
      res.status(200).json(result);
    } catch (error: unknown) {
      res.status(500).json({
        error: getErrorMessage(error, ERROR_FINISH_RESOLUTION),
      });
    }
  };

  guestFinishResolution = async (req: Request, res: Response): Promise<void> => {
    try {
      const equationId = parseRequiredIdParam(req.params);
      const guestSessionId = parseGuestSessionId(req);
      const result = await this.guestResolutionService.finishResolution(
        equationId,
        guestSessionId
      );
      res.status(200).json(result);
    } catch (error: unknown) {
      const status = isValidationError(error) ? 400 : 500;
      res.status(status).json({
        error: getErrorMessage(error, ERROR_FINISH_RESOLUTION),
      });
    }
  };
}
