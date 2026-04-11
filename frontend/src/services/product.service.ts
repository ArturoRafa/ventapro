import { api } from './api';
import type { Product, CreateProductDto, UpdateProductDto } from '../types/product.types';
import type { PaginatedResponse } from '../types/api.types';

interface ProductFilters {
  page?: number;
  limit?: number;
  subcategoryId?: number;
  type?: string;
  status?: string;
  search?: string;
}

export async function getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<PaginatedResponse<Product>>(`/api/productos${query}`);
}

export async function getProductById(id: number): Promise<Product> {
  const response = await api.get<{ data: Product }>(`/api/productos/${id}`);
  return response.data;
}

export async function createProduct(data: CreateProductDto): Promise<Product> {
  const response = await api.post<{ data: Product }>('/api/productos', data);
  return response.data;
}

export async function updateProduct(id: number, data: UpdateProductDto): Promise<Product> {
  const response = await api.put<{ data: Product }>(`/api/productos/${id}`, data);
  return response.data;
}

export async function toggleProductStatus(id: number): Promise<Product> {
  const response = await api.patch<{ data: Product }>(`/api/productos/${id}/estado`);
  return response.data;
}

export async function getLowStockProducts(): Promise<Product[]> {
  const response = await api.get<{ data: Product[] }>('/api/productos/low-stock');
  return response.data;
}
