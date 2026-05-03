export function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: '$2a$10$hashedpassword',
    role: 'cashier',
    status: 'activo',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    code: 'PROD-001',
    name: 'Test Product',
    subcategoryId: 1,
    type: 'inventory',
    price: 1000,
    stock: 50,
    minStock: 5,
    status: 'activo',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildCustomer(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Test Customer',
    phone: '3001234567',
    alternatePhone: null,
    address: null,
    status: 'activo',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildCashRegister(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    cashierId: 1,
    initialAmount: 100000,
    actualCloseAmount: null,
    systemCloseAmount: null,
    difference: null,
    status: 'abierta',
    openedAt: new Date('2025-01-01T08:00:00'),
    closedAt: null,
    closingNotes: null,
    ...overrides,
  };
}

export function buildSale(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    cashRegisterId: 1,
    cashierId: 1,
    customerId: null,
    total: 5000,
    paymentMethod: 'cash',
    status: 'paid',
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildCredit(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    customerId: 1,
    saleId: 1,
    totalAmount: 5000,
    pendingBalance: 5000,
    status: 'pending',
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function buildCategory(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Test Category',
    order: 0,
    status: 'activo',
    subcategories: [],
    ...overrides,
  };
}

export function buildSubcategory(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    categoryId: 1,
    name: 'Test Subcategory',
    order: 0,
    status: 'activo',
    ...overrides,
  };
}

export function buildBusinessConfig(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    businessName: 'Test Cafe',
    requiresOpeningAmount: false,
    usesCredit: true,
    usesFood: true,
    usesCashRegister: true,
    taxPercentage: 0,
    currencyCode: 'COP',
    currencySymbol: '$',
    ...overrides,
  };
}
