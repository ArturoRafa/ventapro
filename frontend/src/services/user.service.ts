import { api } from './api';

export interface UserSummary {
  id: number;
  name: string;
  role: string;
}

export interface UserAdmin {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'cashier';
  status: 'activo' | 'inactivo';
  createdAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'cashier';
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'cashier';
}

export async function getUsers(): Promise<UserSummary[]> {
  const response = await api.get<{ data: UserSummary[] }>('/api/usuarios');
  return response.data;
}

export async function getAllUsers(): Promise<UserAdmin[]> {
  const response = await api.get<{ data: UserAdmin[] }>('/api/usuarios');
  return response.data;
}

export async function createUser(dto: CreateUserDto): Promise<UserAdmin> {
  const response = await api.post<{ data: UserAdmin }>('/api/usuarios', dto);
  return response.data;
}

export async function updateUser(id: number, dto: UpdateUserDto): Promise<UserAdmin> {
  const response = await api.put<{ data: UserAdmin }>(`/api/usuarios/${id}`, dto);
  return response.data;
}

export async function toggleUserStatus(id: number): Promise<UserAdmin> {
  const response = await api.patch<{ data: UserAdmin }>(`/api/usuarios/${id}/status`);
  return response.data;
}
