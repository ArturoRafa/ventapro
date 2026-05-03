export interface Customer {
  id: number;
  name: string;
  phone: string;
  alternatePhone: string | null;
  address: string | null;
  status: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  phone?: string;
  alternatePhone?: string | null;
  address?: string | null;
}
