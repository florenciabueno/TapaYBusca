import { Request, Response } from 'express';
import { EquationService } from './equation.service.js';
import { ResolutionService } from './resolution.service.js';
import {
  CreateEquationDto,
  UpdateEquationUserDto,
  DownloadEquationsDto,
  ResolveStepDto,
  EquationOrigin,
  EquationStatus,
} from './equation.types.js';

const VALID_ORIGINS = new Set<string>(Object.values(EquationOrigin));
const VALID_STATUSES = new Set<string>(Object.values(EquationStatus));
const LIST_STATUS_DELETED = 'DELETED';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 50;

const ERROR_GET_EQUATIONS = 'Error al obtener ecuaciones';
const ERROR_EQUATION_NOT_FOUND = 'Ecuación no encontrada';
const ERROR_GET_EQUATION = 'Error al obtener la ecuación';
const ERROR_CREATE_EQUATION = 'Error al crear la ecuación';
const ERROR_UPDATE_EQUATION = 'Error al actualizar la ecuación';
const ERROR_DELETE_EQUATION = 'Error al eliminar la ecuación';
const ERROR_GET_FOR_UPLOAD = 'Error al obtener ecuaciones para subir';
const ERROR_UPLOAD_EQUATIONS = 'Error al subir ecuaciones';
const ERROR_DOWNLOAD_EQUATIONS = 'Error al descargar ecuaciones';
const ERROR_DATE_RANGE = 'La fecha desde no puede ser posterior a la fecha hasta.';
const PERMISSION_ERROR_KEYWORD = 'permisos';
const ERROR_RESOLVE_STEP = 'Error al validar el paso';
const ERROR_GET_RESOLUTION = 'Error al obtener la resolución';
const ERROR_RESET_RESOLUTION = 'Error al reiniciar la resolución';

export class EquationController {
  constructor(
    private equationService: EquationService,
    private resolutionService: ResolutionService
  ) {}

  getPublicEquations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit } = this.parsePageAndLimit(req.query);
      const statuses = this.parseStatusesQuery(req.query);
      const dateFilters = this.parseDateFilters(req.query);
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
        error: this.getErrorMessage(error, ERROR_GET_EQUATIONS),
      });
    }
  };

  getAllEquations = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { page, limit } = this.parsePageAndLimit(req.query);
      const origins = this.parseOriginsQuery(req.query);
      const { workflowStatuses, deletedOnly } = this.parseUserListStatusesQuery(req.query);
      const dateFilters = this.parseDateFilters(req.query);
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
        deletedOnly
      );
      res.status(200).json(result);
    } catch (error: unknown) {
      res.status(500).json({
        error: this.getErrorMessage(error, ERROR_GET_EQUATIONS),
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
        error: this.getErrorMessage(error, ERROR_GET_FOR_UPLOAD),
      });
    }
  };

  uploadEquations = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const userEquationIds = this.parseUserEquationIds(req.body);
      await this.equationService.uploadEquations(userId, userEquationIds);
      res.status(200).json({ ok: true });
    } catch (error: unknown) {
      res.status(400).json({
        error: this.getErrorMessage(error, ERROR_UPLOAD_EQUATIONS),
      });
    }
  };

  downloadEquations = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const dto = this.parseDownloadBody(req.body);
      const result = await this.equationService.downloadEquations(userId, dto);
      res.status(200).json(result);
    } catch (error: unknown) {
      res.status(400).json({
        error: this.getErrorMessage(error, ERROR_DOWNLOAD_EQUATIONS),
      });
    }
  };

  getEquationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const equation = await this.equationService.getEquationById(id);
      if (!equation) {
        res.status(404).json({ error: ERROR_EQUATION_NOT_FOUND });
        return;
      }
      res.status(200).json(equation);
    } catch (error: unknown) {
      res.status(500).json({
        error: this.getErrorMessage(error, ERROR_GET_EQUATION),
      });
    }
  };

  createEquation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const data: CreateEquationDto = {
        expression: req.body.equation,
        userId,
      };
      const equation = await this.equationService.createEquation(data);
      res.status(201).json(equation);
    } catch (error: unknown) {
      res.status(400).json({
        error: this.getErrorMessage(error, ERROR_CREATE_EQUATION),
      });
    }
  };

  updateEquation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const data: UpdateEquationUserDto = req.body;
      const equation = await this.equationService.updateEquation(id, data, userId);
      res.status(200).json(equation);
    } catch (error: unknown) {
      const status = this.isPermissionError(error) ? 403 : 400;
      res.status(status).json({
        error: this.getErrorMessage(error, ERROR_UPDATE_EQUATION),
      });
    }
  };

  deleteEquation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      await this.equationService.deleteEquation(id, userId);
      res.status(204).send();
    } catch (error: unknown) {
      const status = this.isPermissionError(error) ? 403 : 400;
      res.status(status).json({
        error: this.getErrorMessage(error, ERROR_DELETE_EQUATION),
      });
    }
  };

  resolveStep = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: userEquationId } = req.params;
      const userId = req.userId!;
      const payload = this.parseResolveStepBody(req.body);
      const result = await this.resolutionService.resolveStep(userEquationId, userId, payload);
      res.status(200).json(result);
    } catch (error: unknown) {
      res.status(400).json({
        error: this.getErrorMessage(error, ERROR_RESOLVE_STEP),
      });
    }
  };

  getResolution = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: userEquationId } = req.params;
      const userId = req.userId!;
      const data = await this.resolutionService.getResolution(userEquationId, userId);
      if (!data) {
        res.status(404).json({ error: ERROR_EQUATION_NOT_FOUND });
        return;
      }
      res.status(200).json(data);
    } catch (error: unknown) {
      res.status(500).json({
        error: this.getErrorMessage(error, ERROR_GET_RESOLUTION),
      });
    }
  };

  resetResolution = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: userEquationId } = req.params;
      const userId = req.userId!;
      const ok = await this.resolutionService.resetResolution(userEquationId, userId);
      if (!ok) {
        res.status(403).json({ error: 'No tienes permisos para reiniciar esta ecuación' });
        return;
      }
      res.status(200).json({ ok: true });
    } catch (error: unknown) {
      res.status(500).json({
        error: this.getErrorMessage(error, ERROR_RESET_RESOLUTION),
      });
    }
  };

  private parseResolveStepBody(body: unknown): ResolveStepDto {
    const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const subEquationPostfix = Array.isArray(b.subEquationPostfix)
      ? (b.subEquationPostfix as string[])
      : undefined;
    const subEquationInfix = typeof b.subEquationInfix === 'string'
      ? b.subEquationInfix
      : undefined;
    const answer = typeof b.answer === 'string'
      ? b.answer
      : '';
    const resolutionStepStatus =
      typeof b.resolutionStepStatus === 'number'
        ? b.resolutionStepStatus
        : undefined;
    return {
      subEquationPostfix,
      subEquationInfix,
      answer,
      resolutionStepStatus: resolutionStepStatus ?? 1,
    };
  }

  private parsePageAndLimit(query: Request['query']): { page: number; limit: number } {
    const page = Math.max(DEFAULT_PAGE, parseInt(String(query.page), 10) || DEFAULT_PAGE);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(String(query.limit), 10) || DEFAULT_LIMIT)
    );
    return { page, limit };
  }

  private parseOriginsQuery(query: Request['query']): EquationOrigin[] | undefined {
    const raw = query.origins;
    if (raw === undefined || raw === '') return undefined;
    const values = Array.isArray(raw) ? raw : [raw];
    const parsed = values
      .filter((v): v is string => typeof v === 'string')
      .flatMap((v) => v.split(',').map((s) => s.trim()))
      .filter((v) => VALID_ORIGINS.has(v));
    return parsed.length === 0 ? undefined : (parsed as EquationOrigin[]);
  }

  private parseStatusesQuery(query: Request['query']): EquationStatus[] | undefined {
    const raw = query.statuses;
    if (raw === undefined || raw === '') return undefined;
    const values = Array.isArray(raw) ? raw : [raw];
    const parsed = values
      .filter((v): v is string => typeof v === 'string')
      .flatMap((v) => v.split(',').map((s) => s.trim()))
      .filter((v) => VALID_STATUSES.has(v));
    return parsed.length === 0 ? undefined : (parsed as EquationStatus[]);
  }

  private parseUserListStatusesQuery(query: Request['query']): {
    workflowStatuses?: EquationStatus[];
    deletedOnly: boolean;
  } {
    const raw = query.statuses;
    if (raw === undefined || raw === '') {
      return { workflowStatuses: undefined, deletedOnly: false };
    }
    const values = Array.isArray(raw) ? raw : [raw];
    const tokens = values
      .filter((v): v is string => typeof v === 'string')
      .flatMap((v) => v.split(',').map((s) => s.trim()))
      .filter((v) => v.length > 0);
    const deletedOnly = tokens.includes(LIST_STATUS_DELETED);
    const workflow = tokens.filter(
      (v): v is EquationStatus => v !== LIST_STATUS_DELETED && VALID_STATUSES.has(v)
    );
    return {
      workflowStatuses: workflow.length === 0 ? undefined : workflow,
      deletedOnly,
    };
  }

  private parseOptionalDate(value: unknown): Date | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const str = typeof value === 'string' ? value.trim() : String(value);
    if (!str) return undefined;
    const date = new Date(str);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private parseDateFilters(
    query: Request['query']
  ): { fromDate?: Date; toDate?: Date } | { error: string } {
    const fromDate = this.parseOptionalDate(query.fromDate);
    const toDate = this.parseOptionalDate(query.toDate);
    if (fromDate !== undefined && toDate !== undefined && fromDate > toDate) {
      return { error: ERROR_DATE_RANGE };
    }
    return { fromDate, toDate };
  }

  private parseUserEquationIds(body: unknown): string[] {
    if (body == null || typeof body !== 'object') return [];
    const arr = (body as Record<string, unknown>).userEquationIds;
    if (!Array.isArray(arr)) return [];
    return arr.filter((id): id is string => typeof id === 'string');
  }

  private parseDownloadBody(body: unknown): DownloadEquationsDto {
    const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    return {
      quantity:
        typeof b.quantity === 'number'
          ? b.quantity
          : parseInt(String(b.quantity ?? 0), 10),
      fromDate: typeof b.fromDate === 'string' ? b.fromDate : undefined,
      toDate: typeof b.toDate === 'string' ? b.toDate : undefined,
    };
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }

  private isPermissionError(error: unknown): boolean {
    return error instanceof Error && error.message.includes(PERMISSION_ERROR_KEYWORD);
  }
}
