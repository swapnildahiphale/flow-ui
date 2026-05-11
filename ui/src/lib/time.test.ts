import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { relative, dayKey, groupByDay } from './time';

describe('relative', () => {
  beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-05-11T17:00:00Z')); });
  afterAll(() => { vi.useRealTimers(); });

  it('formats sub-minute as "just now"', () => expect(relative('2026-05-11T16:59:55Z')).toBe('just now'));
  it('formats minutes', () => expect(relative('2026-05-11T16:50:00Z')).toBe('10m ago'));
  it('formats hours', () => expect(relative('2026-05-11T15:00:00Z')).toBe('2h ago'));
  it('formats days', () => expect(relative('2026-05-09T17:00:00Z')).toBe('2d ago'));
  it('formats dates older than 14d', () => expect(relative('2026-04-01T17:00:00Z')).toBe('Apr 01'));
});

describe('groupByDay', () => {
  it('groups by YYYY-MM-DD', () => {
    const items = [
      { date: '2026-05-11' }, { date: '2026-05-11' }, { date: '2026-05-10' },
    ];
    const g = groupByDay(items, x => x.date);
    expect(Object.keys(g)).toEqual(['2026-05-11', '2026-05-10']);
    expect(g['2026-05-11']).toHaveLength(2);
  });
});

describe('dayKey', () => {
  it('returns YYYY-MM-DD in local time', () => {
    expect(dayKey('2026-05-11T01:23:45Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
