import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { matchProduct, toDbNutrition } from '../data/products';
import { analyzeShelf, ClaudeApiError, ClaudeConfigError, hasApiKey as hasApiKeyFn } from './claude';
import { prepareImageForApi } from './imagePrep';
import type { AnalysisResult, AppMode, EnrichedItem, EnrichedRecommended } from './types';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

interface SessionState {
  image: PickedImage | null;
  mode: AppMode;
  query: string;
  loading: boolean;
  error: string | null;
  result: AnalysisResult | null;
}

interface SessionActions {
  setImage: (image: PickedImage | null) => void;
  setMode: (mode: AppMode) => void;
  setQuery: (query: string) => void;
  runAnalysis: () => Promise<boolean>;
  resetResult: () => void;
  clearError: () => void;
}

type SessionContextValue = SessionState & SessionActions & { hasApiKey: boolean };

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [mode, setMode] = useState<AppMode>('search');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const runAnalysis = useCallback(async (): Promise<boolean> => {
    if (!image) {
      setError('まず写真を選んでください。');
      return false;
    }
    if (!query.trim()) {
      setError('知りたいことを入力してください。');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const prepared = await prepareImageForApi(image.uri);
      const raw = await analyzeShelf({
        base64Image: prepared.base64,
        mediaType: prepared.mediaType,
        mode,
        query: query.trim(),
      });

      const matches: EnrichedItem[] = raw.matches.map((m) => {
        const product = matchProduct(m.name);
        return { ...m, db: product ? toDbNutrition(product) : null };
      });

      let recommended: EnrichedRecommended | null = null;
      if (raw.recommended) {
        const product = matchProduct(raw.recommended.name);
        recommended = { ...raw.recommended, db: product ? toDbNutrition(product) : null };
      }

      // 枠座標は API が見た画像基準なので、表示も prepared と同じものを使う
      setResult({
        mode,
        query: query.trim(),
        answer: raw.answer,
        notFound: raw.not_found,
        recommended,
        matches,
        imageUri: prepared.uri,
        imageWidth: prepared.width,
        imageHeight: prepared.height,
      });
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
  }, [image, mode, query]);

  const resetResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<SessionContextValue>(
    () => ({
      image,
      mode,
      query,
      loading,
      error,
      result,
      hasApiKey: hasApiKeyFn(),
      setImage,
      setMode,
      setQuery,
      runAnalysis,
      resetResult,
      clearError,
    }),
    [image, mode, query, loading, error, result, runAnalysis, resetResult, clearError]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
