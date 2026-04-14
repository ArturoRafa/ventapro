import { AppDataSource } from '../config/database';
import { Sale } from '../entities/Sale';
import { SaleDetail } from '../entities/SaleDetail';
import { Credit } from '../entities/Credit';
import { CashRegister } from '../entities/CashRegister';
import { SelectQueryBuilder } from 'typeorm';
import {
  ReportDateRangeDto,
  TopProductsFilters,
  CashRegisterReportFilters,
} from '../dtos/report.dto';

const saleRepo = () => AppDataSource.getRepository(Sale);
const detailRepo = () => AppDataSource.getRepository(SaleDetail);
const creditRepo = () => AppDataSource.getRepository(Credit);
const registerRepo = () => AppDataSource.getRepository(CashRegister);

/* ── Helpers ─────────────────────────────────────────── */

function nextDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function applyDateRange(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  qb: SelectQueryBuilder<any>,
  alias: string,
  column: string,
  filters: ReportDateRangeDto,
): void {
  if (filters.from) {
    qb.andWhere(`${alias}.${column} >= :from`, { from: filters.from });
  }
  if (filters.to) {
    qb.andWhere(`${alias}.${column} < :toNextDay`, { toNextDay: nextDay(filters.to) });
  }
}

function pf(value: string | undefined | null): number {
  return parseFloat(value ?? '0') || 0;
}

function pi(value: string | undefined | null): number {
  return parseInt(value ?? '0', 10) || 0;
}

/* ── 1. Sales Summary ────────────────────────────────── */

export async function salesSummary(filters: ReportDateRangeDto) {
  const qb = saleRepo()
    .createQueryBuilder('s')
    .select('COALESCE(SUM(s.total), 0)', 'totalRevenue')
    .addSelect('COUNT(s.id)', 'salesCount')
    .addSelect('COALESCE(AVG(s.total), 0)', 'averageTicket')
    // By payment method
    .addSelect("COALESCE(SUM(CASE WHEN s.paymentMethod = 'cash' THEN s.total ELSE 0 END), 0)", 'cashTotal')
    .addSelect("COUNT(CASE WHEN s.paymentMethod = 'cash' THEN 1 END)", 'cashCount')
    .addSelect("COALESCE(SUM(CASE WHEN s.paymentMethod = 'card' THEN s.total ELSE 0 END), 0)", 'cardTotal')
    .addSelect("COUNT(CASE WHEN s.paymentMethod = 'card' THEN 1 END)", 'cardCount')
    .addSelect("COALESCE(SUM(CASE WHEN s.paymentMethod = 'transfer' THEN s.total ELSE 0 END), 0)", 'transferTotal')
    .addSelect("COUNT(CASE WHEN s.paymentMethod = 'transfer' THEN 1 END)", 'transferCount')
    // By status
    .addSelect("COALESCE(SUM(CASE WHEN s.status = 'paid' THEN s.total ELSE 0 END), 0)", 'paidTotal')
    .addSelect("COUNT(CASE WHEN s.status = 'paid' THEN 1 END)", 'paidCount')
    .addSelect("COALESCE(SUM(CASE WHEN s.status = 'pending' THEN s.total ELSE 0 END), 0)", 'pendingTotal')
    .addSelect("COUNT(CASE WHEN s.status = 'pending' THEN 1 END)", 'pendingCount');

  applyDateRange(qb, 's', 'createdAt', filters);

  const raw = await qb.getRawOne();

  return {
    totalRevenue: pf(raw?.totalRevenue),
    salesCount: pi(raw?.salesCount),
    averageTicket: Math.round(pf(raw?.averageTicket) * 100) / 100,
    byPaymentMethod: {
      cash: { total: pf(raw?.cashTotal), count: pi(raw?.cashCount) },
      card: { total: pf(raw?.cardTotal), count: pi(raw?.cardCount) },
      transfer: { total: pf(raw?.transferTotal), count: pi(raw?.transferCount) },
    },
    byStatus: {
      paid: { total: pf(raw?.paidTotal), count: pi(raw?.paidCount) },
      pending: { total: pf(raw?.pendingTotal), count: pi(raw?.pendingCount) },
    },
  };
}

/* ── 2. Top Products ─────────────────────────────────── */

export async function topProducts(filters: TopProductsFilters) {
  const qb = detailRepo()
    .createQueryBuilder('d')
    .innerJoin('d.product', 'p')
    .innerJoin('d.sale', 's')
    .select('p.id', 'productId')
    .addSelect('p.code', 'productCode')
    .addSelect('p.name', 'productName')
    .addSelect('SUM(d.quantity)', 'totalQuantity')
    .addSelect('COALESCE(SUM(d.subtotal), 0)', 'totalRevenue')
    .groupBy('p.id')
    .addGroupBy('p.code')
    .addGroupBy('p.name');

  applyDateRange(qb, 's', 'createdAt', filters);

  const orderExpr = filters.sortBy === 'revenue' ? 'SUM(d.subtotal)' : 'SUM(d.quantity)';
  qb.orderBy(orderExpr, 'DESC').limit(filters.limit);

  const rows = await qb.getRawMany();

  return rows.map((r) => ({
    productId: pi(r.productId),
    productCode: r.productCode as string,
    productName: r.productName as string,
    totalQuantity: pi(r.totalQuantity),
    totalRevenue: pf(r.totalRevenue),
  }));
}

/* ── 3. Sales by Cashier ─────────────────────────────── */

export async function salesByCashier(filters: ReportDateRangeDto) {
  const qb = saleRepo()
    .createQueryBuilder('s')
    .innerJoin('s.cashier', 'u')
    .select('u.id', 'cashierId')
    .addSelect('u.name', 'cashierName')
    .addSelect('COUNT(s.id)', 'salesCount')
    .addSelect('COALESCE(SUM(s.total), 0)', 'totalRevenue')
    .groupBy('u.id')
    .addGroupBy('u.name')
    .orderBy('SUM(s.total)', 'DESC')
    .limit(100);

  applyDateRange(qb, 's', 'createdAt', filters);

  const rows = await qb.getRawMany();

  return rows.map((r) => ({
    cashierId: pi(r.cashierId),
    cashierName: r.cashierName as string,
    salesCount: pi(r.salesCount),
    totalRevenue: pf(r.totalRevenue),
  }));
}

/* ── 4. Credit Summary ───────────────────────────────── */

export async function creditSummary() {
  const globalRaw = await creditRepo()
    .createQueryBuilder('c')
    .select('COUNT(c.id)', 'totalCredits')
    .addSelect('COALESCE(SUM(c.totalAmount), 0)', 'totalAmount')
    .addSelect('COALESCE(SUM(c.pendingBalance), 0)', 'totalPending')
    .addSelect('COALESCE(SUM(c.totalAmount - c.pendingBalance), 0)', 'totalPaid')
    .getRawOne();

  const byCustomerRows = await creditRepo()
    .createQueryBuilder('c')
    .innerJoin('c.customer', 'cust')
    .select('cust.id', 'customerId')
    .addSelect('cust.name', 'customerName')
    .addSelect('COUNT(c.id)', 'creditCount')
    .addSelect('COALESCE(SUM(c.totalAmount), 0)', 'totalAmount')
    .addSelect('COALESCE(SUM(c.pendingBalance), 0)', 'pendingBalance')
    .groupBy('cust.id')
    .addGroupBy('cust.name')
    .orderBy('SUM(c.pendingBalance)', 'DESC')
    .limit(100)
    .getRawMany();

  return {
    summary: {
      totalCredits: pi(globalRaw?.totalCredits),
      totalAmount: pf(globalRaw?.totalAmount),
      totalPending: pf(globalRaw?.totalPending),
      totalPaid: pf(globalRaw?.totalPaid),
    },
    byCustomer: byCustomerRows.map((r) => ({
      customerId: pi(r.customerId),
      customerName: r.customerName as string,
      creditCount: pi(r.creditCount),
      totalAmount: pf(r.totalAmount),
      pendingBalance: pf(r.pendingBalance),
    })),
  };
}

/* ── 5. Cash Register Summary ────────────────────────── */

export async function cashRegisterSummary(filters: CashRegisterReportFilters) {
  const qb = registerRepo()
    .createQueryBuilder('cr')
    .innerJoin('cr.cashier', 'u')
    .select('cr.id', 'id')
    .addSelect('u.name', 'cashierName')
    .addSelect('cr.initialAmount', 'initialAmount')
    .addSelect('cr.systemCloseAmount', 'systemCloseAmount')
    .addSelect('cr.actualCloseAmount', 'actualCloseAmount')
    .addSelect('cr.difference', 'difference')
    .addSelect('cr.openedAt', 'openedAt')
    .addSelect('cr.closedAt', 'closedAt')
    .where('cr.status = :status', { status: 'cerrada' })
    .orderBy('cr.closedAt', 'DESC')
    .limit(100);

  applyDateRange(qb, 'cr', 'openedAt', filters);

  if (filters.cashierId) {
    qb.andWhere('cr.cashierId = :cashierId', { cashierId: filters.cashierId });
  }

  const rows = await qb.getRawMany();

  return rows.map((r) => ({
    id: pi(r.id),
    cashierName: r.cashierName as string,
    initialAmount: r.initialAmount !== null ? pf(r.initialAmount) : null,
    systemCloseAmount: r.systemCloseAmount !== null ? pf(r.systemCloseAmount) : null,
    actualCloseAmount: r.actualCloseAmount !== null ? pf(r.actualCloseAmount) : null,
    difference: r.difference !== null ? pf(r.difference) : null,
    openedAt: r.openedAt as string,
    closedAt: r.closedAt as string,
  }));
}
