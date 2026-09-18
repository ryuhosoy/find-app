import type { Confidence, RawAnalysis } from './types';
import { getResponseLanguageName, t } from './i18n';
import { pixelBoxToNormalized } from './visionCoords';

/**
 * Claude Vision API 呼び出し（プロトタイプ版・クライアント直接呼び出し）。
 *
 * 注意: EXPO_PUBLIC_ プレフィックスの環境変数はビルドに埋め込まれ、アプリを持つ誰からでも
 * 読み取り可能になる。これは検証・プロトタイプ用途の割り切りであり、本番では必ず自前の
 * バックエンド（プロキシサーバー）経由に切り替え、APIキーをサーバー側だけに置くこと。
 */
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
const ANTHROPIC_MODEL = process.env.EXPO_PUBLIC_ANTHROPIC_MODEL || 'claude-sonnet-5';
const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';

export class ClaudeConfigError extends Error {}
export class ClaudeApiError extends Error {}

export function hasApiKey(): boolean {
  return ANTHROPIC_API_KEY.length > 0;
}

const TOOL_NAME = 'report_shelf_analysis';

function boxSchemaDescription(imageWidth: number, imageHeight: number): string {
  return (
    `Bounding box [x_min, y_min, x_max, y_max] in **pixel coordinates** for image size ` +
    `${imageWidth}×${imageHeight}px (origin top-left, x right, y down). Do not use 0–1000 normalized coords.`
  );
}

function buildAnalysisTool(imageWidth: number, imageHeight: number, language: string) {
  const boxDesc = boxSchemaDescription(imageWidth, imageHeight);
  return {
    name: TOOL_NAME,
    description: 'Report structured analysis of a store-shelf photo.',
    input_schema: {
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          description: `Short friendly reply to the user in ${language} (1–2 sentences).`,
        },
        not_found: {
          type: 'boolean',
          description: 'True if no product matching the request is visible in the image.',
        },
        recommended: {
          type: 'object',
          description:
            'Best single product when the user wants a comparison/recommendation. May omit for pure find-this-product queries.',
          properties: {
            name: { type: 'string', description: 'Product name as written on the package' },
            box_2d: {
              type: 'array',
              items: { type: 'number' },
              minItems: 4,
              maxItems: 4,
              description: boxDesc,
            },
            reason: {
              type: 'string',
              description: `Why this product was chosen, specific to the request, in ${language} (1–2 sentences).`,
            },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          required: ['name', 'box_2d', 'reason', 'confidence'],
        },
        matches: {
          type: 'array',
          description:
            'Each matching/candidate instance. One entry per location if the same product appears multiple times. For comparison requests, include alternatives besides recommended (one per product name).',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              box_2d: {
                type: 'array',
                items: { type: 'number' },
                minItems: 4,
                maxItems: 4,
                description: boxDesc,
              },
              note: {
                type: 'string',
                description: `Short product note (traits, rough calorie/caffeine, fit to request) in ${language} (1 sentence). For alternatives, briefly say why it wasn’t the top pick.`,
              },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            },
            required: ['name', 'box_2d', 'confidence'],
          },
        },
      },
      required: ['answer', 'not_found', 'matches'],
    },
  };
}

function buildSystemPrompt(imageWidth: number, imageHeight: number, language: string): string {
  return `You are a product assistant that looks at convenience-store / supermarket shelf photos and answers the user's request.
Image size is ${imageWidth}×${imageHeight} pixels. Origin (0,0) is top-left; x goes right, y goes down.
box_2d must be pixel coordinates [x_min, y_min, x_max, y_max] tightly around each package. Do not use 0–1000 normalized coordinates.

Only consider products actually visible in the image. Do not invent products that are not shown.
Draw boxes on matching items. If the same product appears in multiple places, box every instance (one matches entry per location).

Depending on the request:
- Finding a specific product (color, brand, appearance) → put all matches in matches. recommended may be omitted.
- Comparing / recommending (calories, caffeine, which is best, etc.) → put the best one in recommended and alternatives in matches, each with a note.

Read package text and logos carefully to avoid look-alike mix-ups.
When mentioning nutrition numbers, treat them as rough general knowledge and hedge (e.g. "likely around…").
Write all user-facing text fields (answer, reason, note) in ${language}.
Always respond only by calling the ${TOOL_NAME} tool; do not output other text.`;
}

function stripDataUrlPrefix(base64: string): string {
  const idx = base64.indexOf(',');
  return base64.startsWith('data:') && idx !== -1 ? base64.slice(idx + 1) : base64;
}

export interface AnalyzeShelfParams {
  base64Image: string;
  mediaType: 'image/jpeg' | 'image/png';
  imageWidth: number;
  imageHeight: number;
  query: string;
}

export async function analyzeShelf({
  base64Image,
  mediaType,
  imageWidth,
  imageHeight,
  query,
}: AnalyzeShelfParams): Promise<RawAnalysis> {
  if (!hasApiKey()) {
    throw new ClaudeConfigError(t('errorNoApiKey'));
  }

  const language = getResponseLanguageName();
  const userText =
    language === 'Japanese'
      ? `この写真について、次の要望に答えてください：「${query}」`
      : `Looking at this photo, answer the following request: "${query}"`;

  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: 1500,
    // claude-sonnet-5 系では temperature 指定が invalid_request になるため送らない
    system: buildSystemPrompt(imageWidth, imageHeight, language),
    tools: [buildAnalysisTool(imageWidth, imageHeight, language)],
    tool_choice: { type: 'tool', name: TOOL_NAME },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: stripDataUrlPrefix(base64Image),
            },
            // 事前リサイズ済みの画像がさらに縮小されると座標がズレるため、超過時はエラーにする
            transformations: { oversized_image: 'error' },
          },
          { type: 'text', text: userText },
        ],
      },
    ],
  };

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        // ブラウザ(Expo web)からの直接呼び出しを許可するための必須ヘッダー。
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ClaudeApiError(t('errorNetwork'));
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = `API error (${res.status})`;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error?.message) message = parsed.error.message;
    } catch {
      // JSONでなければそのまま
    }
    throw new ClaudeApiError(message);
  }

  const json = await res.json();
  const toolUse = (json.content ?? []).find((block: any) => block.type === 'tool_use');
  if (!toolUse) {
    throw new ClaudeApiError(t('errorNoToolResult'));
  }

  return normalizeRawAnalysis(toolUse.input, imageWidth, imageHeight);
}

function normalizeConfidence(c: unknown): Confidence {
  return c === 'high' || c === 'medium' || c === 'low' ? c : 'medium';
}

function normalizeRawAnalysis(input: any, imageWidth: number, imageHeight: number): RawAnalysis {
  const toBox = (box: unknown) => pixelBoxToNormalized(box, imageWidth, imageHeight);

  const matches = Array.isArray(input?.matches)
    ? input.matches
        .filter((m: any) => m && typeof m.name === 'string')
        .map((m: any) => ({
          name: String(m.name),
          box_2d: toBox(m.box_2d),
          confidence: normalizeConfidence(m.confidence),
          note: typeof m.note === 'string' && m.note.trim() ? m.note.trim() : undefined,
        }))
    : [];

  const recommended =
    input?.recommended && typeof input.recommended.name === 'string'
      ? {
          name: String(input.recommended.name),
          box_2d: toBox(input.recommended.box_2d),
          confidence: normalizeConfidence(input.recommended.confidence),
          reason: typeof input.recommended.reason === 'string' ? input.recommended.reason : '',
        }
      : undefined;

  return {
    answer: typeof input?.answer === 'string' ? input.answer : '',
    not_found: Boolean(input?.not_found),
    recommended,
    matches,
  };
}
