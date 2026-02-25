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
  origin: string;
  status: string;
  steps: number;
  date: string;
  isActive: boolean;
}

export interface CreateEquationDto {
  expression: string;
  userId: string;
}

export interface UpdateEquationUserDto {
  status?: EquationStatus;
  isActive?: boolean;
}
