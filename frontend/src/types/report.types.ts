export interface SalesSummary {
  totalRevenue: number;
  salesCount: number;
  averageTicket: number;
  byPaymentMethod: {
    cash: { total: number; count: number };
    card: { total: number; count: number };
    transfer: { total: number; count: number };
  };
  byStatus: {
    paid: { total: number; count: number };
    pending: { total: number; count: number };
  };
}

export interface TopProduct {
  productId: number;
  productCode: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface CashierSales {
  cashierId: number;
  cashierName: string;
  salesCount: number;
  totalRevenue: number;
}

export interface CreditSummaryReport {
  summary: {
    totalCredits: number;
    totalAmount: number;
    totalPending: number;
    totalPaid: number;
  };
  byCustomer: Array<{
    customerId: number;
    customerName: string;
    creditCount: number;
    totalAmount: number;
    pendingBalance: number;
  }>;
}

export interface CashRegisterReport {
  id: number;
  cashierName: string;
  initialAmount: number | null;
  systemCloseAmount: number | null;
  actualCloseAmount: number | null;
  difference: number | null;
  openedAt: string;
  closedAt: string | null;
}

export interface ReportFilters {
  from?: string;
  to?: string;
}

export interface TopProductsFilters extends ReportFilters {
  sortBy?: 'quantity' | 'revenue';
  limit?: number;
}

export interface CashRegisterReportFilters extends ReportFilters {
  cashierId?: number;
}
