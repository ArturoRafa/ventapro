import { ApiErrorResponse } from '@/types/api.types';

const API_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (!response.ok) {
    // Auto-logout on 401 (expired/invalid token)
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new ApiError('Sesion expirada', 'UNAUTHORIZED', 401);
    }

    let error: ApiErrorResponse;
    try {
      error = await response.json();
    } catch {
      throw new ApiError(`Error del servidor (${response.status})`, 'SERVER_ERROR', response.status);
    }
    throw new ApiError(error.message, error.code, error.status, error.details);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string): Promise<T> => request<T>(endpoint),

  post: <T>(endpoint: string, body?: unknown): Promise<T> =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body: unknown): Promise<T> =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body?: unknown): Promise<T> =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string): Promise<T> =>
    request<T>(endpoint, {
      method: 'DELETE',
    }),
};
