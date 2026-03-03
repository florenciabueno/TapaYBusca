import { API_URL } from '../../../config/constants';
import type { Profile, UpdateProfileData } from '../types';
import { useAuthStore } from '../../../stores';

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const profileService = {
  async getProfile(): Promise<Profile> {
    const response = await fetch(`${API_URL}/user/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error al obtener el perfil');
    }

    return response.json();
  },

  async updateProfile(data: UpdateProfileData): Promise<Profile> {
    const response = await fetch(`${API_URL}/user/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar el perfil');
    }

    return response.json();
  },
};
