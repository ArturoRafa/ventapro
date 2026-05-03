import { api } from './api';
import type { CashRegister, OpenCashRegisterDto, CloseCashRegisterDto, CashRegisterFilters } from '../types/cash-register.types';
import type { PaginatedResponse } from '../types/api.types';

export async function getCurrent(): Promise<CashRegister | null> {
  const response = await api.get<{ data: CashRegister | null }>('/api/cajas/actual');
  return response.data;
}

export async function openRegister(dto: OpenCashRegisterDto): Promise<CashRegister> {
  const response = await api.post<{ data: CashRegister }>('/api/cajas/abrir', dto);
  return response.data;
}

export async function closeRegister(dto: CloseCashRegisterDto): Promise<CashRegister> {
  const response = await api.post<{ data: CashRegister }>('/api/cajas/cerrar', dto);
  return response.data;
}

export async function getAll(filters: CashRegisterFilters = {}): Promise<PaginatedResponse<CashRegister>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<PaginatedResponse<CashRegister>>(`/api/cajas${query}`);
}

export async function getById(id: number): Promise<CashRegister> {
  const response = await api.get<{ data: CashRegister }>(`/api/cajas/${id}`);
  return response.data;
}
