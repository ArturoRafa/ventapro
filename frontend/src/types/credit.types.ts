export interface CreditPayment {
  id: number;
  creditId: number;
  customerId: number;
  cashRegisterId: number;
  amount: number;
  date: string;
  notes: string | null;
  cashRegister?: {
    id: number;
  };
}

export interface Credit {
  id: number;
  customerId: number;
  saleId: number;
  totalAmount: number;
  pendingBalance: number;
  status: 'pending' | 'paid';
  createdAt: string;
  customer?: {
    id: number;
    name: string;
    phone: string;
  };
  sale?: {
    id: number;
  };
  payments?: CreditPayment[];
}

export interface CreateCreditPaymentDto {
  amount: number;
  notes?: string;
}

export interface CreditFilters {
  page?: number;
  limit?: number;
  customerId?: number;
  status?: 'pending' | 'paid';
  from?: string;
  to?: string;
}
