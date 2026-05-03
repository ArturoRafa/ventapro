import { api } from './api';

export interface UserSummary {
  id: number;
  name: string;
  role: string;
}

export async function getUsers(): Promise<UserSummary[]> {
  const response = await api.get<{ data: UserSummary[] }>('/api/usuarios');
  return response.data;
}
