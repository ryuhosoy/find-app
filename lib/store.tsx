import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { analyzeShelf, ClaudeApiError, ClaudeConfigError, hasApiKey as hasApiKeyFn } from './claude';
import { prepareImageForApi } from './imagePrep';
import type { AnalysisResult } from './types';

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
}

interface SessionActions {
  setImage: (image: PickedImage | null) => void;
  setQuery: (query: string) => void;
  runAnalysis: () => Promise<boolean>;
  resetResult: () => void;
  clearError: () => void;
}

type SessionContextValue = SessionState & SessionActions & { hasApiKey: boolean };

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [image, setImage] = useState<PickedImage | null>(null);
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
      setError('要望を入力してください。');
      return false;
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
  }, [image, query]);

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
      hasApiKey: hasApiKeyFn(),
      setImage,
      setQuery,
      runAnalysis,
      resetResult,
      clearError,
    }),
    [image, query, loading, error, result, runAnalysis, resetResult, clearError]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
