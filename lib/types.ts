export type AppMode = 'search' | 'recommend';

export type Confidence = 'high' | 'medium' | 'low';

/** 0-1 スケールの正規化座標 [x_min, y_min, x_max, y_max]（左上原点）。 */
export type Box2D = [number, number, number, number];

export interface RawMatch {
  name: string;
  box_2d: Box2D;
  confidence: Confidence;
  /** 商品の簡単な情報（比較候補・見つかった商品向け） */
  note?: string;
}

export interface RawRecommended extends RawMatch {
  reason: string;
}

/** Claude の tool_use.input をそのまま受ける生レスポンス */
export interface RawAnalysis {
  answer: string;
  not_found: boolean;
  recommended?: RawRecommended;
  matches: RawMatch[];
}

/** アプリ内で使う解析結果 */
export interface AnalysisResult {
  mode: AppMode;
  query: string;
  answer: string;
  notFound: boolean;
  recommended: RawRecommended | null;
  matches: RawMatch[];
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
}
