import { API_URL } from '../../../config/constants';
import type { Equation } from '../../../shared/types/equations';

const getAuthHeaders = (token?: string | null) => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
});

function mapItem(eq: { id: string; equation: string; origin: string; status: string; steps: number; date: string }): Equation {
  return {
    id: eq.id,
    equation: eq.equation,
    origin: eq.origin as Equation['origin'],
    status: eq.status as Equation['status'],
    steps: eq.steps,
    date: eq.date,
  };
}

export const createEquationService = {
  async createEquation(equation: string, token?: string | null): Promise<Equation> {
    const response = await fetch(`${API_URL}/equations`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ equation }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof data?.error === 'string' ? data.error : 'Error al crear la ecuación';
      throw new Error(message);
    }

    return mapItem(data);
  },
};
