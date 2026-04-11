/**
 * Format a number as currency.
 * Default: COP with $ symbol and no decimals (Colombian convention).
 */
export function formatCurrency(
  amount: number,
  options?: { locale?: string; currency?: string },
): string {
  const locale = options?.locale || 'es-CO';
  const currency = options?.currency || 'COP';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
