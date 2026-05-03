import { api } from './api';
import type { Product, AdjustStockDto } from '../types/product.types';
import type { PaginatedResponse } from '../types/api.types';

interface StockFilters {
  page?: number;
  limit?: number;
  search?: string;
  lowStockOnly?: boolean;
}

export async function getStockView(filters: StockFilters = {}): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.lowStockOnly) params.set('lowStockOnly', 'true');
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<PaginatedResponse<Product>>(`/api/inventario${query}`);
}

export async function adjustStock(productId: number, data: AdjustStockDto): Promise<Product> {
  const response = await api.patch<{ data: Product }>(`/api/inventario/${productId}`, data);
  return response.data;
}
