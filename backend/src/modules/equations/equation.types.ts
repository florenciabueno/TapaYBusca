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
  origin: EquationOrigin;
  status: EquationStatus;
  steps: number;
  date: string;
  isActive: boolean;
}

export interface UserEquationRow {
  id: string;
  origin: string;
  status: string;
  updatedAt: Date;
  isActive: boolean;
  equation: {
    latexExpression?: string | null;
    infixExpression?: string | null;
    postfixExpression?: string | null;
  };
}

export interface DefaultEquationRow {
  id: string;
  createdAt: Date;
  latexExpression?: string | null;
  infixExpression?: string | null;
  postfixExpression?: string | null;
}

export interface CreateEquationDto {
  expression: string;
  userId: string;
  latexExpression?: string;
}

export interface UpdateEquationUserDto {
  status?: EquationStatus;
  isActive?: boolean;
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
