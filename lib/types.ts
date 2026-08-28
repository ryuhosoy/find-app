export type AppMode = 'search' | 'recommend';

export type Confidence = 'high' | 'medium' | 'low';

/** 0-1 スケールの正規化座標 [x_min, y_min, x_max, y_max]（左上原点）。 */
export type Box2D = [number, number, number, number];

export interface DbNutrition {
  matchedId: string;
  canonicalName: string;
  category: string;
  calories_kcal: number | null;
  caffeine_mg: number | null;
  sugar_g: number | null;
  price_yen: number | null;
  tags: string[];
}

export interface RawMatch {
  name: string;
  box_2d: Box2D;
  confidence: Confidence;
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

export interface EnrichedItem extends RawMatch {
  db: DbNutrition | null;
}

export interface EnrichedRecommended extends RawRecommended {
  db: DbNutrition | null;
}

/** DB 照合まで済ませてアプリ内で使う結果 */
export interface AnalysisResult {
  mode: AppMode;
  query: string;
  answer: string;
  notFound: boolean;
  recommended: EnrichedRecommended | null;
  matches: EnrichedItem[];
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
}
