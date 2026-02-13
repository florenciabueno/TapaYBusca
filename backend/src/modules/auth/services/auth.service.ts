import { AuthRepository } from '../repositories/auth.repository.js';
import { LoginCredentials, AuthResponse, RegisterCredentials } from '../types/auth.types.js';
import { validateLoginCredentials, validateRegisterCredentials } from '../validators/auth.validators.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../../config/env.js';
import { EquationRepository } from '../../equations/repositories/equation.repository.js';

export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private equationRepository: EquationRepository
  ) {}

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const validation = validateLoginCredentials(credentials);
    if (!validation.isValid) {
      throw new Error('Credenciales inválidas: ' + Object.values(validation.errors).join(', '));
    }

    const user = await this.authRepository.findByEmail(credentials.email);
    if (!user) {
      throw new Error('Usuario o contraseña inválidos');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Usuario o contraseña inválidos');
    }

    const token = jwt.sign({
      userId: user.id,
      email: user.email,
    }, config.jwtSecret, {
      expiresIn: config.jwtExpireIn,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const validation = validateRegisterCredentials(credentials);
    if (!validation.isValid) {
      throw new Error('Credenciales inválidas: ' + Object.values(validation.errors).join(', '));
    }

    const existingUser = await this.authRepository.findByEmail(credentials.email);
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(credentials.password, 10);

    const user = await this.authRepository.create({
      email: credentials.email,
      name: credentials.name,
      passwordHash,
    });

    // Agregar ecuaciones por defecto al nuevo usuario
    await this.equationRepository.addDefaultEquationsToUser(user.id);

    const token = jwt.sign({
      userId: user.id,
      email: user.email,
    }, config.jwtSecret, {
      expiresIn: config.jwtExpireIn,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }
}
