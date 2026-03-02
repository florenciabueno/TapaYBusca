import { User } from '@prisma/client';
import { UserRepository } from './user.repository.js';
import { UpdateProfileDto, ProfileResponse, UserUpdatePayload } from './user.types.js';
import { validateUpdateProfile } from './user.validators.js';
import { verifyPassword, hashPassword } from '../../shared/utils/password.js';
import type { VerifyPasswordParams } from '../../shared/types/password.types.js';

const CURRENT_PASSWORD_INVALID_MESSAGE = 'La contraseña actual es incorrecta';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');
    return this.toProfileResponse(user);
  }

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<ProfileResponse> {
    this.ensureHasFieldsToUpdate(data);

    const validation = validateUpdateProfile(data);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors).filter(Boolean).join(', '));
    }

    const updateData = await this.buildUpdateData(userId, data);
    const updatedUser = await this.userRepository.update(userId, updateData);
    return this.toProfileResponse(updatedUser);
  }

  private toProfileResponse(user: User): ProfileResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  private ensureHasFieldsToUpdate(data: UpdateProfileDto): void {
    if (!data.name && !data.password) {
      throw new Error('Debe proporcionar al menos un campo para actualizar');
    }
  }

  private async buildUpdateData(userId: string, data: UpdateProfileDto): Promise<UserUpdatePayload> {
    const updateData: UserUpdatePayload = {};

    if (data.name) {
      updateData.name = data.name.trim();
    }

    if (data.password) {
      await this.verifyCurrentPasswordAndSetNew(userId, data, updateData);
    }

    return updateData;
  }

  private async verifyCurrentPasswordAndSetNew(
    userId: string,
    data: UpdateProfileDto,
    updateData: UserUpdatePayload
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    await verifyPassword({
      plainPassword: data.currentPassword!,
      passwordHash: user.passwordHash,
      invalidMessage: CURRENT_PASSWORD_INVALID_MESSAGE,
    } satisfies VerifyPasswordParams);
    updateData.passwordHash = await hashPassword(data.password!);
  }
}
