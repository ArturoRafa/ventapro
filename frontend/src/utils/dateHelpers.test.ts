import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime } from './dateHelpers';

describe('formatDate', () => {
  it('should return a non-empty string for a valid date string', () => {
    const result = formatDate('2025-06-15');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should include the year', () => {
    const result = formatDate('2025-06-15');
    expect(result).toContain('2025');
  });

  it('should accept a Date object', () => {
    // Use noon UTC to avoid timezone-driven date shift in jsdom
    const result = formatDate(new Date('2025-06-15T12:00:00Z'));
    expect(result).toContain('2025');
  });

  it('should use en-US locale when specified', () => {
    const result = formatDate('2025-03-05', 'en-US');
    expect(result).toContain('2025');
    expect(result).toMatch(/March|3/);
  });

  it('should format different months distinctly', () => {
    const jan = formatDate('2025-01-01');
    const jul = formatDate('2025-07-01');
    expect(jan).not.toBe(jul);
  });
});

describe('formatDateTime', () => {
  it('should return a non-empty string', () => {
    const result = formatDateTime('2025-06-15T10:30:00');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should include the year', () => {
    const result = formatDateTime('2025-06-15T10:30:00');
    expect(result).toContain('2025');
  });

  it('should include time information (hours/minutes)', () => {
    const result = formatDateTime('2025-06-15T10:30:00', 'en-US');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('should produce a longer string than formatDate (includes time)', () => {
    const date = '2025-06-15T10:30:00';
    const dateOnly = formatDate(date);
    const dateTime = formatDateTime(date);
    expect(dateTime.length).toBeGreaterThan(dateOnly.length);
  });
});
