import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import {
  FREE_ANALYSIS_LIMIT,
  limitForPlan,
  PREMIUM_ENTITLEMENT,
  resolvePlanFromProductId,
  type SubscriptionPlan,
} from './constants/subscription';
import { getAppLocale } from './i18n';

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export type PaywallOutcome = 'purchased' | 'restored' | 'cancelled' | 'error' | 'unavailable';

export interface SubscriptionAccess {
  plan: SubscriptionPlan;
  limit: number;
  /** 課金期間の識別子。更新（更新日が変わる）と回数リセット */
  periodKey: string;
  productIdentifier: string | null;
  isPremium: boolean;
}

const FREE_ACCESS: SubscriptionAccess = {
  plan: 'free',
  limit: FREE_ANALYSIS_LIMIT,
  periodKey: 'free',
  productIdentifier: null,
  isPremium: false,
};

/** RevenueCat Paywall Localization の locale（ダッシュボードの `ja` / `en` と揃える） */
function revenueCatUILocale(): string {
  return getAppLocale() === 'ja' ? 'ja' : 'en';
}

/**
 * Paywall 文言が端末の「優先言語」ではなくアプリ UI 言語に追従するよう、
 * RC の preferred locale を明示する。変更時は offerings を再取得してキャッシュを更新する。
 */
async function syncPaywallLocale(): Promise<void> {
  const locale = revenueCatUILocale();
  await Purchases.overridePreferredLocale(locale);
  // override 後はバックグラウンド再取得になるため、表示前に一度待つ
  await Purchases.getOfferings();
}

export function configurePurchases(): void {
  if (Platform.OS === 'web') return;

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.INFO);

  // Test Store の test_ キーは1つで両OS共用。片方だけ設定しても動くようにする。
  const apiKey =
    (Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY) || IOS_API_KEY || ANDROID_API_KEY;
  if (apiKey) {
    Purchases.configure({
      apiKey,
      preferredUILocaleOverride: revenueCatUILocale(),
    });
  }
}

/**
 * 有効なサブスクから週額 / 月額を判定し、期間キーと上限を返す。
 * periodKey は latestPurchaseDate（更新のたびに変わる）に紐づけるので、
 * 課金期間が切り替わると利用回数がリセットされる。
 */
export async function getSubscriptionAccess(): Promise<SubscriptionAccess> {
  if (Platform.OS === 'web') return FREE_ACCESS;

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];
    if (!entitlement) return FREE_ACCESS;

    const productIdentifier = entitlement.productIdentifier;
    let plan = resolvePlanFromProductId(productIdentifier);

    // Entitlement の productId で判定できない場合、activeSubscriptions を見る
    if (!plan) {
      for (const subId of customerInfo.activeSubscriptions) {
        const resolved = resolvePlanFromProductId(subId);
        if (resolved) {
          plan = resolved;
          break;
        }
      }
    }

    // どちらも不明なら月額扱い（上限が大きい方）にして使いすぎを防ぐよりは
    // 週額扱いにして安全側に倒す
    if (!plan) {
      console.warn(
        '[RevenueCat] Unknown premium product; treating as weekly',
        productIdentifier,
        customerInfo.activeSubscriptions
      );
      plan = 'weekly';
    }

    const periodAnchor = entitlement.latestPurchaseDate || entitlement.expirationDate || 'active';
    return {
      plan,
      limit: limitForPlan(plan),
      periodKey: `${plan}:${periodAnchor}`,
      productIdentifier,
      isPremium: true,
    };
  } catch (e) {
    console.warn('[RevenueCat] getSubscriptionAccess failed', e);
    return FREE_ACCESS;
  }
}

export async function isPremiumUser(): Promise<boolean> {
  const access = await getSubscriptionAccess();
  return access.isPremium;
}

/** 開発時のみ CustomerInfo の主要フィールドをログ出力 */
export async function logCustomerInfo(tag = 'RevenueCat'): Promise<void> {
  if (!__DEV__ || Platform.OS === 'web') return;

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const access = await getSubscriptionAccess();
    const entitlements = Object.entries(customerInfo.entitlements.all).map(([id, e]) => ({
      id,
      isActive: e.isActive,
      productIdentifier: e.productIdentifier,
      expirationDate: e.expirationDate,
      latestPurchaseDate: e.latestPurchaseDate,
      willRenew: e.willRenew,
    }));

    console.log(`[${tag}] CustomerInfo`, {
      appUserId: customerInfo.originalAppUserId,
      access,
      isPremium: access.isPremium,
      activeEntitlements: Object.keys(customerInfo.entitlements.active),
      activeSubscriptions: customerInfo.activeSubscriptions,
      allPurchasedProductIdentifiers: customerInfo.allPurchasedProductIdentifiers,
      latestExpirationDate: customerInfo.latestExpirationDate,
      firstSeen: customerInfo.firstSeen,
      requestDate: customerInfo.requestDate,
      managementURL: customerInfo.managementURL,
      entitlements,
    });
  } catch (e) {
    console.warn(`[${tag}] Failed to fetch customer info`, e);
  }
}

export async function presentPaywall(): Promise<PaywallOutcome> {
  if (Platform.OS === 'web') return 'unavailable';

  const apiKey =
    (Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY) || IOS_API_KEY || ANDROID_API_KEY;
  if (!apiKey) return 'unavailable';

  try {
    await syncPaywallLocale();
    const paywallResult = await RevenueCatUI.presentPaywall();
    await logCustomerInfo('RevenueCat after paywall');

    switch (paywallResult) {
      case PAYWALL_RESULT.PURCHASED:
        return 'purchased';
      case PAYWALL_RESULT.RESTORED:
        return 'restored';
      case PAYWALL_RESULT.CANCELLED:
        return 'cancelled';
      case PAYWALL_RESULT.NOT_PRESENTED:
      case PAYWALL_RESULT.ERROR:
      default:
        return 'error';
    }
  } catch (e) {
    console.warn('[RevenueCat] presentPaywall failed', e);
    return 'error';
  }
}
