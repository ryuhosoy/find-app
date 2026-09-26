/** 無料で使える解析回数（端末内・累計） */
export const FREE_ANALYSIS_LIMIT = 3;

/** 週額サブスク: 課金期間（約1週間）あたりの解析上限 */
export const WEEKLY_ANALYSIS_LIMIT = 15;

/** 月額サブスク: 課金期間（約1ヶ月）あたりの解析上限 */
export const MONTHLY_ANALYSIS_LIMIT = 80;

/** RevenueCat ダッシュボードで設定した Entitlement ID */
export const PREMIUM_ENTITLEMENT = 'Buy it! Premium';

/**
 * 週額 / 月額の Product ID。
 * RevenueCat / App Store / Play の実際の ID に合わせて追記する。
 * 未登録でも productId に week / month が含めば自動判定する。
 */
export const WEEKLY_PRODUCT_IDS = [
  '$rc_weekly',
  'weekly',
  'buyit_weekly',
  'buy_it_weekly',
  'com.ryuhosoy.buyit.weekly',
] as const;

export const MONTHLY_PRODUCT_IDS = [
  '$rc_monthly',
  'monthly',
  'buyit_monthly',
  'buy_it_monthly',
  'com.ryuhosoy.buyit.monthly',
] as const;

export type SubscriptionPlan = 'free' | 'weekly' | 'monthly';

export function limitForPlan(plan: SubscriptionPlan): number {
  switch (plan) {
    case 'weekly':
      return WEEKLY_ANALYSIS_LIMIT;
    case 'monthly':
      return MONTHLY_ANALYSIS_LIMIT;
    case 'free':
    default:
      return FREE_ANALYSIS_LIMIT;
  }
}

/** productIdentifier から週額 / 月額を判定。不明なら null */
export function resolvePlanFromProductId(productIdentifier: string): 'weekly' | 'monthly' | null {
  const id = productIdentifier.trim();
  const lower = id.toLowerCase();

  if ((WEEKLY_PRODUCT_IDS as readonly string[]).includes(id) || /(^|[_.-])week(ly)?($|[_.-])/.test(lower)) {
    return 'weekly';
  }
  if ((MONTHLY_PRODUCT_IDS as readonly string[]).includes(id) || /(^|[_.-])month(ly)?($|[_.-])/.test(lower)) {
    return 'monthly';
  }
  return null;
}
