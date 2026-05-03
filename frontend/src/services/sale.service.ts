import { api } from './api';
import type { Sale, CreateSaleDto, SaleFilters } from '../types/sale.types';
import type { PaginatedResponse } from '../types/api.types';

export async function create(dto: CreateSaleDto): Promise<Sale> {
  const response = await api.post<{ data: Sale }>('/api/ventas', dto);
  return response.data;
}

export async function getAll(filters: SaleFilters = {}): Promise<PaginatedResponse<Sale>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<PaginatedResponse<Sale>>(`/api/ventas${query}`);
}

export async function getById(id: number): Promise<Sale> {
  const response = await api.get<{ data: Sale }>(`/api/ventas/${id}`);
  return response.data;
}

export async function downloadTicketPdf(id: number): Promise<void> {
  const blob = await api.getBlob(`/api/ventas/${id}/ticket`);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
