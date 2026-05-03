export interface CashRegister {
  id: number;
  cashierId: number;
  initialAmount: number | null;
  actualCloseAmount: number | null;
  systemCloseAmount: number | null;
  difference: number | null;
  status: 'abierta' | 'cerrada';
  openedAt: string;
  closedAt: string | null;
  closingNotes: string | null;
  cashier?: {
    id: number;
    name: string;
  };
}

export interface OpenCashRegisterDto {
  initialAmount?: number | null;
}

export interface CloseCashRegisterDto {
  actualCloseAmount: number;
  closingNotes?: string;
}

export interface CashRegisterFilters {
  page?: number;
  limit?: number;
  cashierId?: number;
  status?: 'abierta' | 'cerrada';
  from?: string;
  to?: string;
}
