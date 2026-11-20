import { describe, it, expect } from 'vitest';
import { formatDateEn, formatTimeEn, formatStatusEn } from '../lib/export';

describe('Export Formatter Utilities (English Forced)', () => {
  it('should format dates as DD-MM-YYYY in IST (Asia/Kolkata)', () => {
    // 2026-10-02T22:30:00.000Z is 04:00 AM on 03-10-2026 in IST
    const formatted = formatDateEn('2026-10-02T22:30:00.000Z');
    expect(formatted).toBe('03-10-2026');
  });

  it('should format times as 12-hour hh:mm AM/PM in IST (Asia/Kolkata)', () => {
    // 2026-10-02T14:30:00.000Z is 08:00 PM in IST (+5:30)
    const formatted = formatTimeEn('2026-10-02T14:30:00.000Z');
    expect(formatted).toBe('08:00 PM');
  });

  it('should always return English status strings', () => {
    expect(formatStatusEn('final')).toBe('Purchased');
    expect(formatStatusEn('pending')).toBe('Pending');
    expect(formatStatusEn('closed')).toBe('Closed');
  });
});
