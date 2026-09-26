import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { analyzeShelf, ClaudeApiError, ClaudeConfigError, hasApiKey as hasApiKeyFn } from './claude';
import { FREE_ANALYSIS_LIMIT, type SubscriptionPlan } from './constants/subscription';
import { t } from './i18n';
import { prepareImageForApi } from './imagePrep';
import {
  configurePurchases,
  getSubscriptionAccess,
  logCustomerInfo,
  presentPaywall,
  type SubscriptionAccess,
} from './purchases';
import type { AnalysisResult } from './types';
import { getEffectiveUsageCount, incrementUsageForPeriod } from './usageLimit';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

interface SessionState {
  image: PickedImage | null;
  query: string;
  loading: boolean;
  error: string | null;
  result: AnalysisResult | null;
  plan: SubscriptionPlan;
  usageLimit: number;
  usageCount: number;
  billingReady: boolean;
}

interface SessionActions {
  setImage: (image: PickedImage | null) => void;
  setQuery: (query: string) => void;
  runAnalysis: () => Promise<boolean>;
  openPaywall: () => Promise<boolean>;
  resetResult: () => void;
  clearError: () => void;
}

type SessionContextValue = SessionState &
  SessionActions & {
    hasApiKey: boolean;
    isPremium: boolean;
    remainingUses: number;
    hasReachedLimit: boolean;
  };

const SessionContext = createContext<SessionContextValue | null>(null);

async function loadAccessAndUsage(): Promise<{
  access: SubscriptionAccess;
  usageCount: number;
}> {
  const access = await getSubscriptionAccess();
  const usageCount = await getEffectiveUsageCount(access.periodKey, {
    isPremium: access.isPremium,
    limit: access.limit,
  });
  return { access, usageCount };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [usageLimit, setUsageLimit] = useState(FREE_ANALYSIS_LIMIT);
  const [periodKey, setPeriodKey] = useState('free');
  const [usageCount, setUsageCount] = useState(0);
  const [billingReady, setBillingReady] = useState(false);

  const applyAccess = useCallback((access: SubscriptionAccess, count: number) => {
    setPlan(access.plan);
    setUsageLimit(access.limit);
    setPeriodKey(access.periodKey);
    setUsageCount(count);
  }, []);

  useEffect(() => {
    configurePurchases();
    void (async () => {
      await logCustomerInfo('RevenueCat on launch');
      const { access, usageCount: count } = await loadAccessAndUsage();
      applyAccess(access, count);
      setBillingReady(true);
    })();
  }, [applyAccess]);

  const isPremium = plan !== 'free';
  const hasReachedLimit = usageCount >= usageLimit;
  const remainingUses = Math.max(0, usageLimit - usageCount);

  const openPaywall = useCallback(async (): Promise<boolean> => {
    const outcome = await presentPaywall();
    if (outcome === 'purchased' || outcome === 'restored') {
      const { access, usageCount: count } = await loadAccessAndUsage();
      applyAccess(access, count);
      return access.isPremium;
    }
    if (outcome === 'unavailable' || outcome === 'error') {
      Alert.alert(
        t('paywallUnavailableTitle'),
        outcome === 'unavailable' ? t('paywallUnavailableBody') : t('paywallErrorBody')
      );
    }
    return false;
  }, [applyAccess]);

  const runAnalysis = useCallback(async (): Promise<boolean> => {
    if (!image) {
      setError(t('errorNeedPhoto'));
      return false;
    }
    if (!query.trim()) {
      setError(t('errorNeedQuery'));
      return false;
    }

    let activePeriodKey = periodKey;
    let activeLimit = usageLimit;
    let activePlan = plan;
    let activeCount = usageCount;

    if (activeCount >= activeLimit) {
      const unlocked = await openPaywall();
      if (!unlocked) {
        setError(
          activePlan === 'free'
            ? t('errorFreeLimitReached', { limit: activeLimit })
            : t('errorPlanLimitReached', { limit: activeLimit })
        );
        return false;
      }
      const refreshed = await loadAccessAndUsage();
      applyAccess(refreshed.access, refreshed.usageCount);
      activePeriodKey = refreshed.access.periodKey;
      activeLimit = refreshed.access.limit;
      activePlan = refreshed.access.plan;
      activeCount = refreshed.usageCount;
      if (activeCount >= activeLimit) {
        setError(t('errorPlanLimitReached', { limit: activeLimit }));
        return false;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const prepared = await prepareImageForApi(image.uri);
      const raw = await analyzeShelf({
        base64Image: prepared.base64,
        mediaType: prepared.mediaType,
        imageWidth: prepared.width,
        imageHeight: prepared.height,
        query: query.trim(),
      });

      setResult({
        query: query.trim(),
        answer: raw.answer,
        notFound: raw.not_found,
        recommended: raw.recommended ?? null,
        matches: raw.matches,
        imageUri: prepared.uri,
        imageWidth: prepared.width,
        imageHeight: prepared.height,
      });

      const count = await incrementUsageForPeriod(activePeriodKey);
      // 無料枠を使い切った直後も UI を上限到達に揃える
      const effectiveCount =
        activePlan === 'free'
          ? await getEffectiveUsageCount(activePeriodKey, {
              isPremium: false,
              limit: activeLimit,
            })
          : count;
      setUsageCount(effectiveCount);

      return true;
    } catch (e) {
      if (e instanceof ClaudeConfigError || e instanceof ClaudeApiError) {
        setError(e.message);
      } else {
        setError(t('errorUnexpected'));
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [image, query, periodKey, usageLimit, plan, usageCount, openPaywall, applyAccess]);

  const resetResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<SessionContextValue>(
    () => ({
      image,
      query,
      loading,
      error,
      result,
      plan,
      usageLimit,
      usageCount,
      billingReady,
      remainingUses,
      hasReachedLimit,
      isPremium,
      hasApiKey: hasApiKeyFn(),
      setImage,
      setQuery,
      runAnalysis,
      openPaywall,
      resetResult,
      clearError,
    }),
    [
      image,
      query,
      loading,
      error,
      result,
      plan,
      usageLimit,
      usageCount,
      billingReady,
      remainingUses,
      hasReachedLimit,
      isPremium,
      runAnalysis,
      openPaywall,
      resetResult,
      clearError,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
