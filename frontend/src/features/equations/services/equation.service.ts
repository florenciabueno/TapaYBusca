import { API_URL } from '../../../config/constants';
import type { Equation } from '../types';

const getAuthHeaders = (token?: string | null) => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
});

export const equationService = {
  async getAllEquations(token?: string | null): Promise<Equation[]> {
    const endpoint = token ? `${API_URL}/equations` : `${API_URL}/equations/public`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error al obtener ecuaciones');
    }

    const data = await response.json();
    
    return data.map((eq: any) => ({
      id: eq.id,
      equation: eq.equation,
      origin: eq.origin,
      status: eq.status,
      steps: eq.steps,
      date: eq.date,
    }));
  },

  async getEquationById(id: string, token?: string | null): Promise<Equation> {
    const response = await fetch(`${API_URL}/equations/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error al obtener la ecuación');
    }

    return response.json();
  },

  async createEquation(equation: string, origin: string = 'creada', token?: string | null): Promise<Equation> {
    const response = await fetch(`${API_URL}/equations`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ equation, origin: origin.toUpperCase() }),
    });

    if (!response.ok) {
      throw new Error('Error al crear la ecuación');
    }

    return response.json();
  },

  async updateEquation(id: string, data: { status?: string; steps?: number }, token?: string | null): Promise<Equation> {
    const response = await fetch(`${API_URL}/equations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar la ecuación');
    }

    return response.json();
  },

  async deleteEquation(id: string, token?: string | null): Promise<void> {
    const response = await fetch(`${API_URL}/equations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error al eliminar la ecuación');
    }
  },
};
