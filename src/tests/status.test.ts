import { describe, it, expect } from 'vitest';
import { formatStatusEn } from '../lib/export';
import type { VisitStatus } from '../types';

describe('Visit Status Domain Logic', () => {
  it('maps all supported VisitStatus values correctly through formatStatusEn', () => {
    const statuses: VisitStatus[] = ['pending', 'final', 'closed'];
    expect(statuses.map(formatStatusEn)).toEqual(['Pending', 'Purchased', 'Closed']);
  });

  it('handles unknown or default statuses safely as Pending', () => {
    expect(formatStatusEn('unknown_status')).toBe('Pending');
    expect(formatStatusEn('')).toBe('Pending');
  });
});
