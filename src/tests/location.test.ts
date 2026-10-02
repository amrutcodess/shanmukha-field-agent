import { describe, it, expect } from 'vitest';
import { normalizeLocationName } from '../lib/location';

describe('Location Name Normalization', () => {
  it('should trim leading and trailing spaces', () => {
    expect(normalizeLocationName('  Guntur  ')).toBe('Guntur');
  });

  it('should collapse multiple internal spaces into a single space', () => {
    expect(normalizeLocationName('Guntur   Region')).toBe('Guntur Region');
  });

  it('should format names in Title Case', () => {
    expect(normalizeLocationName('guntur region')).toBe('Guntur Region');
    expect(normalizeLocationName('TENALI VILLAGE')).toBe('Tenali Village');
  });

  it('should handle empty or null string gracefully', () => {
    expect(normalizeLocationName('')).toBe('');
  });
});
