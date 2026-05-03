import { api } from './api';
import type { Credit, CreateCreditPaymentDto, CreditFilters } from '../types/credit.types';
import type { PaginatedResponse } from '../types/api.types';

export async function getAll(filters: CreditFilters = {}): Promise<PaginatedResponse<Credit>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<PaginatedResponse<Credit>>(`/api/creditos${query}`);
}

export async function getById(id: number): Promise<Credit> {
  const response = await api.get<{ data: Credit }>(`/api/creditos/${id}`);
  return response.data;
}

export async function createPayment(creditId: number, dto: CreateCreditPaymentDto): Promise<Credit> {
  const response = await api.post<{ data: Credit }>(`/api/creditos/${creditId}/abonos`, dto);
  return response.data;
}
