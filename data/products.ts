import type { DbNutrition } from '../lib/types';

/**
 * 自社商品DB（プロトタイプ版のシード値）。
 *
 * フェーズ2の要件「カロリー・カフェイン量などをAIの一般知識だけに頼らない」に対応するため、
 * 主要なコンビニ商品を最小構成のDBとして持ち、AIが画像から読み取った商品名をここに突き合わせて
 * 数値情報を補強する。値はパッケージ表示等をもとにした参考値であり、実運用では商品情報APIや
 * 自社マスタに差し替える想定。
 */
export interface Product {
  id: string;
  /** 画面表示に使う正式名 */
  canonicalName: string;
  /** AIが返してくる可能性のある表記ゆれ（ひらがな/カタカナ/英語/略称） */
  aliases: string[];
  category: 'エナジードリンク' | '飲料' | 'スナック' | 'チョコ・キャンディ' | 'アイス' | '栄養補助食品';
  calories_kcal: number | null;
  caffeine_mg: number | null;
  sugar_g: number | null;
  price_yen: number | null;
  tags: string[];
}

export const productList: Product[] = [
  {
    id: 'monster-green',
    canonicalName: 'モンスターエナジー（グリーン）',
    aliases: ['モンスターエナジー', 'モンスター グリーン', '緑のモンスター', 'monster energy green', 'monster green'],
    category: 'エナジードリンク',
    calories_kcal: 150,
    caffeine_mg: 142,
    sugar_g: 39,
    price_yen: 238,
    tags: ['眠気覚まし', '高カフェイン', '定番'],
  },
  {
    id: 'monster-zero',
    canonicalName: 'モンスターエナジー アブソリュートリーゼロ',
    aliases: ['モンスターゼロ', '白いモンスター', 'モンスター ゼロ', 'monster absolutely zero', 'monster zero white'],
    category: 'エナジードリンク',
    calories_kcal: 3,
    caffeine_mg: 142,
    sugar_g: 0,
    price_yen: 238,
    tags: ['眠気覚まし', '高カフェイン', '低カロリー', 'ゼロカロリー'],
  },
  {
    id: 'monster-ultra',
    canonicalName: 'モンスターエナジー ウルトラ',
    aliases: ['モンスターウルトラ', 'モンスター ウルトラ', 'monster ultra'],
    category: 'エナジードリンク',
    calories_kcal: 15,
    caffeine_mg: 142,
    sugar_g: 4,
    price_yen: 238,
    tags: ['眠気覚まし', '高カフェイン', '低カロリー'],
  },
  {
    id: 'redbull',
    canonicalName: 'レッドブル・エナジードリンク',
    aliases: ['レッドブル', 'red bull', 'redbull'],
    category: 'エナジードリンク',
    calories_kcal: 113,
    caffeine_mg: 80,
    sugar_g: 27,
    price_yen: 250,
    tags: ['眠気覚まし', '高カフェイン'],
  },
  {
    id: 'coke',
    canonicalName: 'コカ・コーラ',
    aliases: ['コカコーラ', 'コーラ', 'coca cola', 'coke'],
    category: '飲料',
    calories_kcal: 45,
    caffeine_mg: 10,
    sugar_g: 11.3,
    price_yen: 170,
    tags: ['炭酸'],
  },
  {
    id: 'oiocha',
    canonicalName: 'おーいお茶（緑茶）',
    aliases: ['おーいお茶', '緑茶', 'oi ocha', 'green tea'],
    category: '飲料',
    calories_kcal: 0,
    caffeine_mg: 20,
    sugar_g: 0,
    price_yen: 150,
    tags: ['ノンカロリー', '低カフェイン'],
  },
  {
    id: 'jagariko-salad',
    canonicalName: 'じゃがりこ サラダ味',
    aliases: ['じゃがりこ', 'じゃがりこ サラダ', 'jagariko salad'],
    category: 'スナック',
    calories_kcal: 335,
    caffeine_mg: 0,
    sugar_g: 4.9,
    price_yen: 180,
    tags: ['カフェインなし'],
  },
  {
    id: 'jagariko-butter',
    canonicalName: 'じゃがりこ バターしょうゆ味',
    aliases: ['じゃがりこ バター', 'じゃがりこ バターしょうゆ', 'jagariko butter soy'],
    category: 'スナック',
    calories_kcal: 347,
    caffeine_mg: 0,
    sugar_g: 5.6,
    price_yen: 180,
    tags: ['カフェインなし'],
  },
  {
    id: 'umaibo-mentai',
    canonicalName: 'うまい棒 めんたい味',
    aliases: ['うまい棒', 'うまい棒 めんたい', 'umaibo'],
    category: 'スナック',
    calories_kcal: 74,
    caffeine_mg: 0,
    sugar_g: 3.2,
    price_yen: 12,
    tags: ['低価格', 'カフェインなし'],
  },
  {
    id: 'calbee-usushio',
    canonicalName: 'カルビー ポテトチップス うすしお味',
    aliases: ['ポテトチップス うすしお', 'うすしお味', 'calbee potato chips'],
    category: 'スナック',
    calories_kcal: 336,
    caffeine_mg: 0,
    sugar_g: 2.9,
    price_yen: 150,
    tags: ['カフェインなし'],
  },
  {
    id: 'calbee-consomme',
    canonicalName: 'カルビー ポテトチップス コンソメパンチ',
    aliases: ['コンソメパンチ', 'ポテトチップス コンソメ'],
    category: 'スナック',
    calories_kcal: 339,
    caffeine_mg: 0,
    sugar_g: 5.1,
    price_yen: 150,
    tags: ['カフェインなし'],
  },
  {
    id: 'countryma-am',
    canonicalName: 'カントリーマアム（バニラ）',
    aliases: ['カントリーマアム', 'country maam'],
    category: 'チョコ・キャンディ',
    calories_kcal: 458,
    caffeine_mg: 0,
    sugar_g: 30,
    price_yen: 213,
    tags: ['カフェインなし'],
  },
  {
    id: 'black-thunder',
    canonicalName: 'ブラックサンダー',
    aliases: ['black thunder', 'ブラックサンダー'],
    category: 'チョコ・キャンディ',
    calories_kcal: 190,
    caffeine_mg: 5,
    sugar_g: 20,
    price_yen: 34,
    tags: ['低価格'],
  },
  {
    id: 'haagen-vanilla',
    canonicalName: 'ハーゲンダッツ ミニカップ バニラ',
    aliases: ['ハーゲンダッツ', 'ハーゲンダッツ バニラ', 'haagen dazs vanilla'],
    category: 'アイス',
    calories_kcal: 244,
    caffeine_mg: 0,
    sugar_g: 21,
    price_yen: 324,
    tags: ['カフェインなし'],
  },
  {
    id: 'weider-jelly',
    canonicalName: 'ウイダー in ゼリー エネルギー',
    aliases: ['ウイダーインゼリー', 'in ゼリー', 'weider jelly'],
    category: '栄養補助食品',
    calories_kcal: 180,
    caffeine_mg: 0,
    sugar_g: 33.6,
    price_yen: 130,
    tags: ['カフェインなし', '手軽'],
  },
  {
    id: 'calorie-mate',
    canonicalName: 'カロリーメイト（ブロック）',
    aliases: ['カロリーメイト', 'calorie mate'],
    category: '栄養補助食品',
    calories_kcal: 400,
    caffeine_mg: 0,
    sugar_g: 12.8,
    price_yen: 200,
    tags: ['カフェインなし', '腹持ち'],
  },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[・･\-ー－]/g, '');
}

/** 短すぎる偶然の一致は誤爆しやすいので採用しない */
const MIN_MATCH_SCORE = 2;

/** 1商品ぶんの、正規化済み候補名（正式名＋エイリアス）のまとまり */
interface ProductCandidates {
  product: Product;
  normalizedCandidates: string[];
}

/**
 * productList の各商品について、正規化済みの候補名を事前計算しておく。
 * candidate は不変な静的データなので、突き合わせのたびに正規化し直す必要はない。
 */
const productCandidates: ProductCandidates[] = productList.map((product) => ({
  product,
  normalizedCandidates: [product.canonicalName, ...product.aliases]
    .map(normalize)
    .filter((normalizedCandidate) => normalizedCandidate.length > 0),
}));

/**
 * 正規化済み文字列同士の一致度をスコアリングする。
 * - 完全一致: Infinity（他のどんな部分一致よりも優先して採用したいので）
 * - 部分一致（どちらかがもう一方を含む）: 短い方の文字列長
 * - 不一致: null
 */
function scoreMatch(a: string, b: string): number | null {
  if (a === b) return Infinity;
  if (a.includes(b) || b.includes(a)) return Math.min(a.length, b.length);
  return null;
}

function findBestMatch(
  normalizedAiName: string,
): { product: Product; score: number } | null {
  let bestProduct: Product | null = null;
  let bestScore = 0;

  for (const productCandidate of productCandidates) {
    for (const normalizedCandidate of productCandidate.normalizedCandidates) {
      const candidateScore = scoreMatch(normalizedAiName, normalizedCandidate);
      if (candidateScore === null) continue;

      if (candidateScore === Infinity) {
        // 完全一致は即採用。同一名のエイリアスが複数商品にまたがる場合は
        // productList で先に登場する商品が優先される。
        return { product: productCandidate.product, score: normalizedAiName.length };
      }

      if (candidateScore > bestScore) {
        bestScore = candidateScore;
        bestProduct = productCandidate.product;
      }
    }
  }

  return bestProduct ? { product: bestProduct, score: bestScore } : null;
}

/**
 * AIが返した商品名を自社DBに緩やかに突き合わせる。
 * 完全一致でなくても、正規化した文字列同士の部分一致で拾う。
 */
export function matchProduct(aiName: string): Product | null {
  if (!aiName) return null;
  const normalizedAiName = normalize(aiName);
  if (!normalizedAiName) return null;

  const best = findBestMatch(normalizedAiName);
  if (!best || best.score < MIN_MATCH_SCORE) return null;
  
  return best.product;
}

export function toDbNutrition(product: Product): DbNutrition {
  return {
    matchedId: product.id,
    canonicalName: product.canonicalName,
    category: product.category,
    calories_kcal: product.calories_kcal,
    caffeine_mg: product.caffeine_mg,
    sugar_g: product.sugar_g,
    price_yen: product.price_yen,
    tags: product.tags,
  };
}
