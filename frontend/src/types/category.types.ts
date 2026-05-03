export interface Category {
  id: number;
  name: string;
  status: 'activo' | 'inactivo';
  order: number;
  subcategories?: Subcategory[];
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
  status: 'activo' | 'inactivo';
  order: number;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  order?: number;
}

export interface CreateSubcategoryDto {
  categoryId: number;
  name: string;
  order?: number;
}
