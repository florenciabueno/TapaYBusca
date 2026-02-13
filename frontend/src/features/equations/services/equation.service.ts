import { API_URL } from '../../../config/constants';
import type { Equation } from '../types';

export const equationService = {
  async getAllEquations(): Promise<Equation[]> {
    const response = await fetch(`${API_URL}/equations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error al obtener ecuaciones');
    }

    const data = await response.json();
    
    return data.map((eq: any) => ({
      id: eq.id,
      equation: eq.equation,
      origin: eq.origin === 'defecto' ? 'creada' : eq.origin,
      status: eq.status,
      steps: eq.steps,
      date: eq.date,
    }));
  },

  async getEquationById(id: string): Promise<Equation> {
    const response = await fetch(`${API_URL}/equations/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error al obtener la ecuación');
    }

    return response.json();
  },

  async createEquation(equation: string, origin: string = 'creada'): Promise<Equation> {
    const response = await fetch(`${API_URL}/equations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ equation, origin: origin.toUpperCase() }),
    });

    if (!response.ok) {
      throw new Error('Error al crear la ecuación');
    }

    return response.json();
  },

  async updateEquation(id: string, data: { status?: string; steps?: number }): Promise<Equation> {
    const response = await fetch(`${API_URL}/equations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar la ecuación');
    }

    return response.json();
  },

  async deleteEquation(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/equations/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Error al eliminar la ecuación');
    }
  },
};
