import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { analyzeShelf, ClaudeApiError, ClaudeConfigError, hasApiKey as hasApiKeyFn } from './claude';
import { FREE_ANALYSIS_LIMIT } from './constants/subscription';
import { prepareImageForApi } from './imagePrep';
import {
  configurePurchases,
  isPremiumUser,
  logCustomerInfo,
  presentPaywall,
} from './purchases';
import type { AnalysisResult } from './types';
import { getAnalysisCount, incrementAnalysisCount } from './usageLimit';

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
  isPremium: boolean;
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
    remainingUses: number;
    hasReachedLimit: boolean;
  };

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [billingReady, setBillingReady] = useState(false);

  useEffect(() => {
    configurePurchases();
    void (async () => {
      await logCustomerInfo('RevenueCat on launch');
      const [premium, count] = await Promise.all([isPremiumUser(), getAnalysisCount()]);
      setIsPremium(premium);
      setUsageCount(count);
      setBillingReady(true);
    })();
  }, []);

  const hasReachedLimit = !isPremium && usageCount >= FREE_ANALYSIS_LIMIT;
  const remainingUses = isPremium ? Infinity : Math.max(0, FREE_ANALYSIS_LIMIT - usageCount);

  const openPaywall = useCallback(async (): Promise<boolean> => {
    const outcome = await presentPaywall();
    if (outcome === 'purchased' || outcome === 'restored') {
      const premium = await isPremiumUser();
      setIsPremium(premium);
      return premium;
    }
    if (outcome === 'unavailable' || outcome === 'error') {
      Alert.alert(
        'Paywallを表示できません',
        outcome === 'unavailable'
          ? 'RevenueCat の API キー未設定、または Web / Expo Go では課金UIを開けません。開発ビルド（npx expo run:ios）で試してください。'
          : 'Paywallの表示に失敗しました。開発ビルドで起動しているか、RevenueCat の Current Offering / Paywall 設定を確認してください。'
      );
    }
    return false;
  }, []);

  const runAnalysis = useCallback(async (): Promise<boolean> => {
    if (!image) {
      setError('まず写真を選んでください。');
      return false;
    }
    if (!query.trim()) {
      setError('要望を入力してください。');
      return false;
    }

    if (!isPremium && usageCount >= FREE_ANALYSIS_LIMIT) {
      const unlocked = await openPaywall();
      if (!unlocked) {
        setError(`無料枠（${FREE_ANALYSIS_LIMIT}回）を使い切りました。プレミアムに加入すると続けて使えます。`);
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

      if (!isPremium) {
        const count = await incrementAnalysisCount();
        setUsageCount(count);
      }

      return true;
    } catch (e) {
      if (e instanceof ClaudeConfigError || e instanceof ClaudeApiError) {
        setError(e.message);
      } else {
        setError('解析中に予期しないエラーが発生しました。もう一度お試しください。');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [image, query, isPremium, usageCount, openPaywall]);

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
      isPremium,
      usageCount,
      billingReady,
      remainingUses,
      hasReachedLimit,
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
      isPremium,
      usageCount,
      billingReady,
      remainingUses,
      hasReachedLimit,
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
