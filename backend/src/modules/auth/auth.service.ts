import { User } from '@prisma/client';
import { AuthRepository } from './auth.repository.js';
import { LoginCredentials, AuthResponse, RegisterCredentials, CreateUserPayload } from './auth.types.js';
import { validateLoginCredentials, validateRegisterCredentials } from './auth.validators.js';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { EquationRepository } from '../equations/equation.repository.js';
import { verifyPassword, hashPassword } from '../../shared/utils/password.js';
import { ensureValidationPassed } from '../../shared/utils/validation.js';
import type { VerifyPasswordParams } from '../../shared/types/password.types.js';

const INVALID_CREDENTIALS_MESSAGE = 'Usuario o contraseña inválidos';
const CREDENTIALS_VALIDATION_ERROR_PREFIX = 'Credenciales inválidas: ';
const EMAIL_ALREADY_REGISTERED_MESSAGE = 'El email ya está registrado';

export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private equationRepository: EquationRepository
  ) {}

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    ensureValidationPassed(validateLoginCredentials(credentials), CREDENTIALS_VALIDATION_ERROR_PREFIX);
    const user = await this.findUserByEmailOrThrow(credentials.email);
    await verifyPassword({
      plainPassword: credentials.password,
      passwordHash: user.passwordHash,
      invalidMessage: INVALID_CREDENTIALS_MESSAGE,
    } satisfies VerifyPasswordParams);
    const token = this.createToken(user.id, user.email);
    return this.toAuthResponse(user, token);
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    ensureValidationPassed(validateRegisterCredentials(credentials), CREDENTIALS_VALIDATION_ERROR_PREFIX);
    await this.ensureEmailNotRegistered(credentials.email);
    const passwordHash = await hashPassword(credentials.password);
    const user = await this.authRepository.create({
      email: credentials.email,
      name: credentials.name,
      passwordHash,
    } satisfies CreateUserPayload);
    await this.equationRepository.addDefaultEquationsToUser(user.id);
    const token = this.createToken(user.id, user.email);
    return this.toAuthResponse(user, token);
  }

  private async findUserByEmailOrThrow(email: string): Promise<User> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) throw new Error(INVALID_CREDENTIALS_MESSAGE);
    return user;
  }

  private createToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      config.jwtSecret,
      { expiresIn: config.jwtExpireIn } as jwt.SignOptions
    );
  }

  private toAuthResponse(user: User, token: string): AuthResponse {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  private async ensureEmailNotRegistered(email: string): Promise<void> {
    const existing = await this.authRepository.findByEmail(email);
    if (existing) throw new Error(EMAIL_ALREADY_REGISTERED_MESSAGE);
  }
}
