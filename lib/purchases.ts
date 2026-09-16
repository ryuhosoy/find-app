import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import { PREMIUM_ENTITLEMENT } from './constants/subscription';

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export type PaywallOutcome = 'purchased' | 'restored' | 'cancelled' | 'error' | 'unavailable';

export function configurePurchases(): void {
  if (Platform.OS === 'web') return;

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.INFO);

  // Test Store の test_ キーは1つで両OS共用。片方だけ設定しても動くようにする。
  const apiKey =
    (Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY) || IOS_API_KEY || ANDROID_API_KEY;
  if (apiKey) {
    Purchases.configure({ apiKey });
  }
}

export async function isPremiumUser(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== 'undefined';
  } catch {
    return false;
  }
}

/** 開発時のみ CustomerInfo の主要フィールドをログ出力 */
export async function logCustomerInfo(tag = 'RevenueCat'): Promise<void> {
  if (!__DEV__ || Platform.OS === 'web') return;

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlements = Object.entries(customerInfo.entitlements.all).map(([id, e]) => ({
      id,
      isActive: e.isActive,
      productIdentifier: e.productIdentifier,
      expirationDate: e.expirationDate,
      willRenew: e.willRenew,
    }));

    console.log(`[${tag}] CustomerInfo`, {
      appUserId: customerInfo.originalAppUserId,
      isPremium: typeof customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== 'undefined',
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
