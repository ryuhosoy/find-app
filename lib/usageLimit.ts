import AsyncStorage from '@react-native-async-storage/async-storage';

import { FREE_ANALYSIS_LIMIT } from './constants/subscription';

/** 期間キーごとの利用回数。期間が変わると自動で 0 から数え直す */
const USAGE_STATE_KEY = 'analysis_usage_v2';

/** 旧・無料累計キー（移行用） */
const LEGACY_ANALYSIS_COUNT_KEY = 'analysis_count';

/**
 * 無料枠を一度でも使い切ったか。
 * true のあいだは、サブスク失効後も無料枠は再付与しない（課金必須）。
 */
const FREE_QUOTA_EXHAUSTED_KEY = 'free_quota_exhausted';

interface UsageState {
  periodKey: string;
  count: number;
}

async function readState(): Promise<UsageState | null> {
  const raw = await AsyncStorage.getItem(USAGE_STATE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as UsageState;
      if (typeof parsed.periodKey === 'string' && typeof parsed.count === 'number') {
        return parsed;
      }
    } catch {
      // fall through
    }
  }

  // 旧キーからの移行（無料累計）
  const legacy = await AsyncStorage.getItem(LEGACY_ANALYSIS_COUNT_KEY);
  if (legacy != null) {
    const count = Number.parseInt(legacy, 10);
    if (Number.isFinite(count) && count > 0) {
      const migrated: UsageState = { periodKey: 'free', count };
      await AsyncStorage.setItem(USAGE_STATE_KEY, JSON.stringify(migrated));
      if (count >= FREE_ANALYSIS_LIMIT) {
        await markFreeQuotaExhausted();
      }
      return migrated;
    }
  }

  return null;
}

async function writeState(state: UsageState): Promise<void> {
  await AsyncStorage.setItem(USAGE_STATE_KEY, JSON.stringify(state));
}

export async function hasExhaustedFreeQuota(): Promise<boolean> {
  const value = await AsyncStorage.getItem(FREE_QUOTA_EXHAUSTED_KEY);
  return value === '1';
}

export async function markFreeQuotaExhausted(): Promise<void> {
  await AsyncStorage.setItem(FREE_QUOTA_EXHAUSTED_KEY, '1');
}

/** 現在の課金期間（または無料）における利用回数 */
export async function getUsageCountForPeriod(periodKey: string): Promise<number> {
  const state = await readState();
  if (!state || state.periodKey !== periodKey) return 0;
  return state.count;
}

/**
 * 画面・判定用の実効利用回数。
 * 無料かつ一度でも枠を使い切っている場合は、常に上限到達扱い（課金必須）。
 */
export async function getEffectiveUsageCount(
  periodKey: string,
  options: { isPremium: boolean; limit: number }
): Promise<number> {
  const count = await getUsageCountForPeriod(periodKey);

  if (!options.isPremium) {
    if (count >= options.limit) {
      await markFreeQuotaExhausted();
      return options.limit;
    }
    if (await hasExhaustedFreeQuota()) {
      return options.limit;
    }
  }

  return count;
}

/** 成功した解析を1回カウント。期間キーが変わっていれば 1 から開始 */
export async function incrementUsageForPeriod(periodKey: string): Promise<number> {
  const state = await readState();
  const nextCount = !state || state.periodKey !== periodKey ? 1 : state.count + 1;
  await writeState({ periodKey, count: nextCount });

  if (periodKey === 'free' && nextCount >= FREE_ANALYSIS_LIMIT) {
    await markFreeQuotaExhausted();
  }

  return nextCount;
}
