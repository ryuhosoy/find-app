import { describe, expect, it } from 'vitest';

import {
  FREE_ANALYSIS_LIMIT,
  MONTHLY_ANALYSIS_LIMIT,
  WEEKLY_ANALYSIS_LIMIT,
  limitForPlan,
  resolvePlanFromProductId,
} from '../constants/subscription';

describe('resolvePlanFromProductId', () => {
  it('recognizes weekly product ids', () => {
    expect(resolvePlanFromProductId('premium_weekly_buy_it')).toBe('weekly');
    expect(resolvePlanFromProductId('premium_weekly')).toBe('weekly');
  });

  it('recognizes monthly product ids', () => {
    expect(resolvePlanFromProductId('premium_monthly_buy_it')).toBe('monthly');
    expect(resolvePlanFromProductId('premium_monthly')).toBe('monthly');
  });

  it('returns null for ids not in the lists', () => {
    expect(resolvePlanFromProductId('premium_pro')).toBeNull();
    expect(resolvePlanFromProductId('weekly')).toBeNull();
    expect(resolvePlanFromProductId('$rc_monthly')).toBeNull();
    expect(resolvePlanFromProductId('')).toBeNull();
  });
});

describe('limitForPlan', () => {
  it('returns the configured limits', () => {
    expect(limitForPlan('free')).toBe(FREE_ANALYSIS_LIMIT);
    expect(limitForPlan('weekly')).toBe(WEEKLY_ANALYSIS_LIMIT);
    expect(limitForPlan('monthly')).toBe(MONTHLY_ANALYSIS_LIMIT);
    expect(FREE_ANALYSIS_LIMIT).toBe(3);
    expect(WEEKLY_ANALYSIS_LIMIT).toBe(15);
    expect(MONTHLY_ANALYSIS_LIMIT).toBe(80);
  });
});

/** store.tsx と同じ計算式 */
function remainingUses(limit: number, usageCount: number): number {
  return Math.max(0, limit - usageCount);
}

describe('remainingUses countdown', () => {
  it('counts down for weekly plan', () => {
    expect(remainingUses(15, 0)).toBe(15);
    expect(remainingUses(15, 1)).toBe(14);
    expect(remainingUses(15, 15)).toBe(0);
    expect(remainingUses(15, 20)).toBe(0);
  });

  it('counts down for monthly plan', () => {
    expect(remainingUses(80, 79)).toBe(1);
    expect(remainingUses(80, 80)).toBe(0);
  });
});
