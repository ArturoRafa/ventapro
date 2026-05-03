export interface Product {
  id: number;
  code: string;
  name: string;
  subcategoryId: number;
  type: 'inventory' | 'food';
  price: number;
  stock: number;
  minStock: number;
  status: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt: string;
  subcategory?: {
    id: number;
    name: string;
    category?: {
      id: number;
      name: string;
    };
  };
}

export interface CreateProductDto {
  code: string;
  name: string;
  subcategoryId: number;
  type: 'inventory' | 'food';
  price: number;
  stock: number;
  minStock: number;
}

export interface UpdateProductDto {
  code?: string;
  name?: string;
  subcategoryId?: number;
  type?: 'inventory' | 'food';
  price?: number;
  stock?: number;
  minStock?: number;
}

export interface AdjustStockDto {
  adjustment: number;
  reason?: string;
}
