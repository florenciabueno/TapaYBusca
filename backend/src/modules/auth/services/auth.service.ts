import { AuthRepository } from '../repositories/auth.repository.js';
import { LoginCredentials, AuthResponse, RegisterCredentials } from '../types/auth.types.js';
import { UpdateProfileDto, ProfileResponse } from '../types/profile.types.js';
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

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      config.jwtSecret,
      {
        expiresIn: config.jwtExpireIn,
      } as jwt.SignOptions
    );

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

    await this.equationRepository.addDefaultEquationsToUser(user.id);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      config.jwtSecret,
      {
        expiresIn: config.jwtExpireIn,
      } as jwt.SignOptions
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await this.authRepository.findById(userId);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<ProfileResponse> {
    if (!data.name && !data.password) {
      throw new Error('Debe proporcionar al menos un campo para actualizar');
    }

    const updateData: { name?: string; passwordHash?: string } = {};

    if (data.name) {
      if (data.name.trim().length < 2) {
        throw new Error('El nombre debe tener al menos 2 caracteres');
      }
      updateData.name = data.name.trim();
    }

    if (data.password) {
      if (!data.currentPassword) {
        throw new Error('Debe proporcionar la contraseña actual para cambiarla');
      }

      if (data.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }

      const user = await this.authRepository.findById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new Error('La contraseña actual es incorrecta');
      }

      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await this.authRepository.update(userId, updateData);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
    };
  }
}
