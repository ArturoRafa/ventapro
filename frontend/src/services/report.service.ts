import { api } from './api';
import type {
  SalesSummary,
  TopProduct,
  CashierSales,
  CreditSummaryReport,
  CashRegisterReport,
  ReportFilters,
  TopProductsFilters,
  CashRegisterReportFilters,
} from '../types/report.types';

function buildQuery(filters: object): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function getSalesSummary(filters: ReportFilters = {}): Promise<SalesSummary> {
  const response = await api.get<{ data: SalesSummary }>(`/api/reportes/ventas${buildQuery(filters)}`);
  return response.data;
}

export async function getTopProducts(filters: TopProductsFilters = {}): Promise<TopProduct[]> {
  const response = await api.get<{ data: TopProduct[] }>(`/api/reportes/productos-top${buildQuery(filters)}`);
  return response.data;
}

export async function getSalesByCashier(filters: ReportFilters = {}): Promise<CashierSales[]> {
  const response = await api.get<{ data: CashierSales[] }>(`/api/reportes/ventas-por-cajero${buildQuery(filters)}`);
  return response.data;
}

export async function getCreditSummary(): Promise<CreditSummaryReport> {
  const response = await api.get<{ data: CreditSummaryReport }>('/api/reportes/creditos');
  return response.data;
}

export async function getCashRegisterSummary(filters: CashRegisterReportFilters = {}): Promise<CashRegisterReport[]> {
  const response = await api.get<{ data: CashRegisterReport[] }>(`/api/reportes/cajas${buildQuery(filters)}`);
  return response.data;
}
