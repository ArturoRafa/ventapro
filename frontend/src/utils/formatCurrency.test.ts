import { describe, it, expect } from 'vitest';
import { formatCurrency } from './formatCurrency';

describe('formatCurrency', () => {
  it('should format a number as COP by default', () => {
    const result = formatCurrency(50000);
    expect(result).toContain('50');
    expect(result).toContain('000');
    expect(result).toContain('$');
  });

  it('should format zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toContain('$');
  });

  it('should not include decimal places for COP', () => {
    const result = formatCurrency(1500);
    // jsdom uses '.' as thousands separator in es-CO, so we check for absence of decimal cents
    expect(result).not.toMatch(/[.,]\d{2}$/);
  });

  it('should format large amounts', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('1');
    expect(result).toContain('000');
  });

  it('should accept custom locale', () => {
    const cop = formatCurrency(5000, { locale: 'es-CO' });
    const us = formatCurrency(5000, { locale: 'en-US', currency: 'USD' });
    expect(cop).toBeTruthy();
    expect(us).toBeTruthy();
    expect(cop).not.toBe(us);
  });

  it('should return a string', () => {
    expect(typeof formatCurrency(1234)).toBe('string');
  });
});
