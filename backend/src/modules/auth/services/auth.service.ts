import { AuthRepository } from '../repositories/auth.repository';
import { LoginCredentials, AuthResponse } from '../types/auth.types';
import { validateLoginCredentials } from '../validators/auth.validators';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../../config/env';

export class AuthService {
  constructor(private authRepository: AuthRepository) {}

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Validar credenciales
    const validation = validateLoginCredentials(credentials);
    if (!validation.isValid) {
      throw new Error('Credenciales inválidas: ' + Object.values(validation.errors).join(', '));
    }

    // Buscar usuario por email
    const user = await this.authRepository.findByEmail(credentials.email);
    if (!user) {
      throw new Error('Usuario o contraseña inválidos');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Usuario o contraseña inválidos');
    }

    // Generar token JWT
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
