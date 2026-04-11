/**
 * Format a date string or Date to a readable locale string.
 * Default: Colombian Spanish format.
 */
export function formatDate(date: string | Date, locale = 'es-CO'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date with time.
 */
export function formatDateTime(date: string | Date, locale = 'es-CO'): string {
  return new Date(date).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
