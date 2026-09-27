import { beforeEach, describe, expect, it, vi } from 'vitest';

const memory = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => memory.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      memory.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      memory.delete(key);
    }),
    clear: vi.fn(async () => {
      memory.clear();
    }),
  },
}));

import {
  FREE_ANALYSIS_LIMIT,
  MONTHLY_ANALYSIS_LIMIT,
  WEEKLY_ANALYSIS_LIMIT,
} from '../constants/subscription';
import {
  getEffectiveUsageCount,
  getUsageCountForPeriod,
  hasExhaustedFreeQuota,
  incrementUsageForPeriod,
} from '../usageLimit';

/** purchases.ts と同じ periodKey の組み立て */
function periodKeyFor(plan: 'weekly' | 'monthly', latestPurchaseDate: string): string {
  return `${plan}:${latestPurchaseDate}`;
}

beforeEach(() => {
  memory.clear();
});

describe('usage count within a billing period', () => {
  it('increments on each successful analysis', async () => {
    const key = periodKeyFor('weekly', '2026-09-01T00:00:00Z');

    expect(await getUsageCountForPeriod(key)).toBe(0);
    expect(await incrementUsageForPeriod(key)).toBe(1);
    expect(await incrementUsageForPeriod(key)).toBe(2);
    expect(await incrementUsageForPeriod(key)).toBe(3);
    expect(await getUsageCountForPeriod(key)).toBe(3);
  });

  it('shows remaining = limit - count for weekly', async () => {
    const key = periodKeyFor('weekly', '2026-09-01T00:00:00Z');
    await incrementUsageForPeriod(key);
    await incrementUsageForPeriod(key);

    const count = await getUsageCountForPeriod(key);
    const remaining = Math.max(0, WEEKLY_ANALYSIS_LIMIT - count);
    expect(remaining).toBe(13);
  });

  it('shows remaining = limit - count for monthly', async () => {
    const key = periodKeyFor('monthly', '2026-09-01T00:00:00Z');
    for (let i = 0; i < 5; i++) {
      await incrementUsageForPeriod(key);
    }

    const count = await getUsageCountForPeriod(key);
    expect(Math.max(0, MONTHLY_ANALYSIS_LIMIT - count)).toBe(75);
  });
});

describe('subscription renewal resets usage', () => {
  it('resets to 0 when latestPurchaseDate (periodKey) changes on weekly renew', async () => {
    const periodA = periodKeyFor('weekly', '2026-09-01T00:00:00Z');
    const periodB = periodKeyFor('weekly', '2026-09-08T00:00:00Z'); // 更新後

    for (let i = 0; i < 10; i++) {
      await incrementUsageForPeriod(periodA);
    }
    expect(await getUsageCountForPeriod(periodA)).toBe(10);

    // 更新後の periodKey では未使用扱い
    expect(await getUsageCountForPeriod(periodB)).toBe(0);

    // 新しい期間で数え直し
    expect(await incrementUsageForPeriod(periodB)).toBe(1);
    expect(await getUsageCountForPeriod(periodB)).toBe(1);
    // 旧期間の記録は残っていても、新キーでは影響しない
    expect(await getUsageCountForPeriod(periodA)).toBe(0);
  });

  it('resets to 0 when monthly subscription renews', async () => {
    const periodA = periodKeyFor('monthly', '2026-09-01T00:00:00Z');
    const periodB = periodKeyFor('monthly', '2026-10-01T00:00:00Z');

    for (let i = 0; i < 80; i++) {
      await incrementUsageForPeriod(periodA);
    }
    expect(await getUsageCountForPeriod(periodA)).toBe(80);
    expect(Math.max(0, MONTHLY_ANALYSIS_LIMIT - 80)).toBe(0);
 
    expect(await getUsageCountForPeriod(periodB)).toBe(0);
    expect(await incrementUsageForPeriod(periodB)).toBe(1);
    expect(Math.max(0, MONTHLY_ANALYSIS_LIMIT - 1)).toBe(79);
  });
 
  it('starts at 1 when first increment happens on a new period key', async () => {
    const oldKey = periodKeyFor('weekly', 'date-old');
    const newKey = periodKeyFor('weekly', 'date-new');

    await incrementUsageForPeriod(oldKey);
    await incrementUsageForPeriod(oldKey);
    expect(await incrementUsageForPeriod(newKey)).toBe(1);
  });
});

describe('free quota exhausted persists after premium ends', () => {
  it('marks free quota exhausted after 3 free uses', async () => {
    expect(await hasExhaustedFreeQuota()).toBe(false);

    await incrementUsageForPeriod('free');
    await incrementUsageForPeriod('free');
    expect(await hasExhaustedFreeQuota()).toBe(false);

    await incrementUsageForPeriod('free');
    expect(await hasExhaustedFreeQuota()).toBe(true);
  });

  it('does not re-grant free uses after subscription expires', async () => {
    // 無料を使い切る
    for (let i = 0; i < FREE_ANALYSIS_LIMIT; i++) {
      await incrementUsageForPeriod('free');
    }
    expect(await hasExhaustedFreeQuota()).toBe(true);

    // 週額を利用
    const weeklyKey = periodKeyFor('weekly', '2026-09-01T00:00:00Z');
    await incrementUsageForPeriod(weeklyKey);
    expect(
      await getEffectiveUsageCount(weeklyKey, { isPremium: true, limit: WEEKLY_ANALYSIS_LIMIT })
    ).toBe(1);

    // サブスク失効 → 無料に戻るが、実効回数は上限（課金必須）
    const effectiveFree = await getEffectiveUsageCount('free', {
      isPremium: false,
      limit: FREE_ANALYSIS_LIMIT,
    });
    expect(effectiveFree).toBe(FREE_ANALYSIS_LIMIT);
    expect(Math.max(0, FREE_ANALYSIS_LIMIT - effectiveFree)).toBe(0);
  });

  it('still allows free uses if free was never exhausted', async () => {
    await incrementUsageForPeriod('free');
    await incrementUsageForPeriod('free');
    expect(await hasExhaustedFreeQuota()).toBe(false);

    // 課金して失効しても、無料未消化なら残りがある
    const weeklyKey = periodKeyFor('weekly', '2026-09-01TJJ00:00:00Z');
    await incrementUsageForPeriod(weeklyKey);

    // periodKey が free に戻ると保存キー不一致で count=0。
    // ただし使い切っていないので再付与される（仕様どおり）
    const effectiveFree = await getEffectiveUsageCount('free', {
      isPremium: false,
      limit: FREE_ANALYSIS_LIMIT,
    });
    expect(effectiveFree).toBe(0);
    expect(await hasExhaustedFreeQuota()).toBe(false);
  });
});
