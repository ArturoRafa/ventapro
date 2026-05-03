export interface SaleDetail {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface Sale {
  id: number;
  cashRegisterId: number;
  customerId: number | null;
  cashierId: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  status: 'paid' | 'pending';
  createdAt: string;
  details?: SaleDetail[];
  customer?: {
    id: number;
    name: string;
    phone: string;
  };
  cashier?: {
    id: number;
    name: string;
  };
  credit?: {
    id: number;
  };
}

export interface CreateSaleItemDto {
  productId: number;
  quantity: number;
}

export interface CreateSaleDto {
  items: CreateSaleItemDto[];
  paymentMethod: 'cash' | 'card' | 'transfer';
  customerId?: number;
  status?: 'paid' | 'pending';
}

export interface SaleFilters {
  page?: number;
  limit?: number;
  cashRegisterId?: number;
  cashierId?: number;
  paymentMethod?: 'cash' | 'card' | 'transfer';
  status?: 'paid' | 'pending';
  from?: string;
  to?: string;
}
