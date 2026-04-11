import { api } from './api';
import type { BusinessConfig } from '../types/config.types';

export async function getConfig(): Promise<BusinessConfig> {
  const response = await api.get<{ data: BusinessConfig }>('/api/configuracion');
  return response.data;
}

export async function updateConfig(data: Partial<BusinessConfig>): Promise<BusinessConfig> {
  const response = await api.put<{ data: BusinessConfig }>('/api/configuracion', data);
  return response.data;
}
