import { describe, it, expect } from 'vitest';
import { formatDateEn, formatTimeEn, formatStatusEn } from '../lib/export';

describe('Export Formatter Utilities (English Forced)', () => {
  it('should format dates as DD-MM-YYYY', () => {
    const formatted = formatDateEn('2026-10-02T14:30:00.000Z');
    expect(formatted).toMatch(/^\d{2}-\d{2}-\d{4}$/);
  });

  it('should format times as 12-hour hh:mm AM/PM', () => {
    const formatted = formatTimeEn('2026-10-02T14:30:00.000Z');
    expect(formatted).toMatch(/\d{2}:\d{2}\s(AM|PM)/);
  });

  it('should always return English status strings', () => {
    expect(formatStatusEn('final')).toBe('Purchased');
    expect(formatStatusEn('pending')).toBe('Pending');
    expect(formatStatusEn('closed')).toBe('Closed');
  });
});
