import { api } from './api';
import type { User, LoginCredentials } from '../types/auth.types';

interface LoginResponse {
  token: string;
  user: User;
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await api.post<{ data: LoginResponse }>('/api/auth/login', credentials);
  return response.data;
}
