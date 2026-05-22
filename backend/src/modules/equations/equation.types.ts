export enum EquationStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SOLVED = 'SOLVED',
}

export enum EquationOrigin {
  DEFAULT = 'DEFAULT',
  CREATED = 'CREATED',
  DOWNLOADED = 'DOWNLOADED',
}

export interface EquationResponse {
  id: string;
  equation: string;
  infixExpression?: string | null;
  origin: EquationOrigin;
  status: EquationStatus;
  steps: number;
  date: string;
  isActive: boolean;
}

export interface EquationExpressions {
  latexExpression?: string | null;
  infixExpression?: string | null;
  postfixExpression?: string | null;
}

export interface UserEquationRow {
  id: string;
  origin: string;
  status: string;
  updatedAt: Date;
  isActive: boolean;
  equation: EquationExpressions;
}

export interface DefaultEquationRow extends EquationExpressions {
  id: string;
  createdAt: Date;
  solutionValues?: unknown;
}

export interface CreateEquationDto {
  expression: string;
  userId: string;
  latexExpression?: string;
  solutionValues?: number[];
}

export interface ResolveStepDto {
  subEquationInfix?: string;
  answer: string;
  resolutionStepStatus: number;
}

export interface ResolveStepResponse {
  code: string;
  message?: string;
}

export interface UpdateEquationUserDto {
  status?: EquationStatus;
  isActive?: boolean;
  currentResolutionId?: number;
  selectedBranch?: string;
}

export type ResolutionStateUpdate = Pick<
  UpdateEquationUserDto,
  'status' | 'currentResolutionId' | 'selectedBranch'
>;

/** Equation payload stored in guest RAM. */
export type StoredEquationSnapshot = Omit<DefaultEquationRow, 'id' | 'createdAt'>;

export interface CreateResolutionInput {
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
}

export interface PaginatedEquationsResponse {
  data: EquationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UploadableEquationResponse {
  id: string;
  equation: string;
  isPublished: boolean;
}

export interface UploadEquationsDto {
  userEquationIds: string[];
}

export interface DownloadEquationsDto {
  quantity: number;
  fromDate?: string;
  toDate?: string;
}

export interface DownloadEquationsResult {
  added: number;
  totalRequested: number;
}

export interface EquationValidationResult {
  isValid: boolean;
  errors: string[];
}
