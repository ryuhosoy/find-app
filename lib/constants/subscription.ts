/** 無料で使える解析回数（端末内・累計） */
export const FREE_ANALYSIS_LIMIT = 3;

/** 週額サブスク: 課金期間（約1週間）あたりの解析上限 */
export const WEEKLY_ANALYSIS_LIMIT = 15;

/** 月額サブスク: 課金期間（約1ヶ月）あたりの解析上限 */
export const MONTHLY_ANALYSIS_LIMIT = 80;

/** RevenueCat ダッシュボードで設定した Entitlement ID */
export const PREMIUM_ENTITLEMENT = 'Buy it! Premium';

/** 週額 / 月額の Product ID（完全一致で判定する） */
export const WEEKLY_PRODUCT_IDS = [
  'premium_weekly_buy_it',
  'premium_weekly',
] as const;

export const MONTHLY_PRODUCT_IDS = [
  'premium_monthly_buy_it',
  'premium_monthly',
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

  if ((WEEKLY_PRODUCT_IDS as readonly string[]).includes(id)) {
    return 'weekly';
  }
  if ((MONTHLY_PRODUCT_IDS as readonly string[]).includes(id)) {
    return 'monthly';
  }
  return null;
}
