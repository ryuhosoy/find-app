import type { Box2D } from './types';

/** Claude standard resolution tier limits (claude-sonnet-5 等). */
const MAX_EDGE = 1568;
const MAX_TOKENS = 1568;

/** Visual tokens consumed by an image: one token per 28×28 pixel patch. */
export function countImageTokens(width: number, height: number): number {
  return Math.ceil(width / 28) * Math.ceil(height / 28);
}

/** Round half to even (banker's rounding), matching Python's round(). */
function roundTiesToEven(value: number): number {
  const floor = Math.floor(value);
  if (value - floor !== 0.5) return Math.round(value);
  return floor % 2 === 0 ? floor : floor + 1;
}

/**
 * Claude が画像を処理する前にリサイズするサイズを計算する。
 * @see https://platform.claude.com/docs/en/build-with-claude/vision-coordinates
 */
export function resizedSize(
  width: number,
  height: number,
  maxEdge = MAX_EDGE,
  maxTokens = MAX_TOKENS
): [number, number] {
  const fits = (w: number, h: number): boolean =>
    Math.ceil(w / 28) * 28 <= maxEdge &&
    Math.ceil(h / 28) * 28 <= maxEdge &&
    countImageTokens(w, h) <= maxTokens;

  if (fits(width, height)) return [width, height];
  if (height > width) {
    const [resizedH, resizedW] = resizedSize(height, width, maxEdge, maxTokens);
    return [resizedW, resizedH];
  }

  const aspectRatio = width / height;
  let lo = 1;
  let hi = width;
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid, Math.max(roundTiesToEven(mid / aspectRatio), 1))) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return [lo, Math.max(roundTiesToEven(lo / aspectRatio), 1)];
}

/**
 * Claude が返すピクセル座標（または稀な 0-1 / 0-1000 レガシー値）を
 * 0-1 正規化座標 [x_min, y_min, x_max, y_max] に変換する。
 */
export function pixelBoxToNormalized(
  box: unknown,
  imageWidth: number,
  imageHeight: number
): Box2D {
  const arr = Array.isArray(box) ? box.map((n) => Number(n)) : [0, 0, 0, 0];
  let x1 = Number.isFinite(arr[0]) ? arr[0]! : 0;
  let y1 = Number.isFinite(arr[1]) ? arr[1]! : 0;
  let x2 = Number.isFinite(arr[2]) ? arr[2]! : 0;
  let y2 = Number.isFinite(arr[3]) ? arr[3]! : 0;

  if (x1 > x2) [x1, x2] = [x2, x1];
  if (y1 > y2) [y1, y2] = [y2, y1];

  const w = Math.max(imageWidth, 1);
  const h = Math.max(imageHeight, 1);
  const maxVal = Math.max(x1, y1, x2, y2);

  // 0-1 正規化（稀なレガシー互換）
  if (maxVal <= 1) {
    return [clamp01(x1), clamp01(y1), clamp01(x2), clamp01(y2)];
  }

  // ピクセル座標（プロンプトで明示しているため、こちらが通常）
  const clampX = (n: number) => Math.max(0, Math.min(w, n));
  const clampY = (n: number) => Math.max(0, Math.min(h, n));
  return [
    clamp01(clampX(x1) / w),
    clamp01(clampY(y1) / h),
    clamp01(clampX(x2) / w),
    clamp01(clampY(y2) / h),
  ];
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}
