import { api } from './api';
import type { Category, Subcategory, CreateCategoryDto, CreateSubcategoryDto } from '../types/category.types';

export async function getCategories(includeInactive = false): Promise<Category[]> {
  const params = includeInactive ? '?includeInactive=true' : '';
  const response = await api.get<{ data: Category[] }>(`/api/categorias${params}`);
  return response.data;
}

export async function getCategoryById(id: number): Promise<Category> {
  const response = await api.get<{ data: Category }>(`/api/categorias/${id}`);
  return response.data;
}

export async function createCategory(data: CreateCategoryDto): Promise<Category> {
  const response = await api.post<{ data: Category }>('/api/categorias', data);
  return response.data;
}

export async function updateCategory(id: number, data: Partial<CreateCategoryDto>): Promise<Category> {
  const response = await api.put<{ data: Category }>(`/api/categorias/${id}`, data);
  return response.data;
}

export async function toggleCategoryStatus(id: number): Promise<Category> {
  const response = await api.patch<{ data: Category }>(`/api/categorias/${id}/estado`);
  return response.data;
}

// Subcategories
export async function getSubcategories(categoryId?: number, includeInactive = false): Promise<Subcategory[]> {
  const params = new URLSearchParams();
  if (categoryId) params.set('categoryId', String(categoryId));
  if (includeInactive) params.set('includeInactive', 'true');
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await api.get<{ data: Subcategory[] }>(`/api/subcategorias${query}`);
  return response.data;
}

export async function createSubcategory(data: CreateSubcategoryDto): Promise<Subcategory> {
  const response = await api.post<{ data: Subcategory }>('/api/subcategorias', data);
  return response.data;
}

export async function updateSubcategory(id: number, data: Partial<CreateSubcategoryDto>): Promise<Subcategory> {
  const response = await api.put<{ data: Subcategory }>(`/api/subcategorias/${id}`, data);
  return response.data;
}

export async function toggleSubcategoryStatus(id: number): Promise<Subcategory> {
  const response = await api.patch<{ data: Subcategory }>(`/api/subcategorias/${id}/estado`);
  return response.data;
}

export async function deleteSubcategory(id: number): Promise<void> {
  await api.delete(`/api/subcategorias/${id}`);
}
