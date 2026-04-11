import { api } from './api';
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from '../types/customer.types';
import type { PaginatedResponse } from '../types/api.types';

interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export async function getCustomers(filters: CustomerFilters = {}): Promise<PaginatedResponse<Customer>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<PaginatedResponse<Customer>>(`/api/clientes${query}`);
}

export async function getCustomerById(id: number): Promise<Customer> {
  const response = await api.get<{ data: Customer }>(`/api/clientes/${id}`);
  return response.data;
}

export async function createCustomer(data: CreateCustomerDto): Promise<Customer> {
  const response = await api.post<{ data: Customer }>('/api/clientes', data);
  return response.data;
}

export async function updateCustomer(id: number, data: UpdateCustomerDto): Promise<Customer> {
  const response = await api.put<{ data: Customer }>(`/api/clientes/${id}`, data);
  return response.data;
}

export async function toggleCustomerStatus(id: number): Promise<Customer> {
  const response = await api.patch<{ data: Customer }>(`/api/clientes/${id}/estado`);
  return response.data;
}
