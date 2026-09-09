import type { Confidence, RawAnalysis } from './types';
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
    `バウンディングボックス [x_min, y_min, x_max, y_max]。` +
    `画像サイズ ${imageWidth}×${imageHeight}px の**ピクセル座標**（左上原点、x右・y下）。` +
    `0〜1000 の正規化座標は使わないこと。`
  );
}

function buildAnalysisTool(imageWidth: number, imageHeight: number) {
  const boxDesc = boxSchemaDescription(imageWidth, imageHeight);
  return {
    name: TOOL_NAME,
    description: '棚の写真を解析した結果を構造化データとして報告する。',
    input_schema: {
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          description: 'ユーザーへの一言回答。日本語で、フレンドリーかつ簡潔に（1〜2文）。',
        },
        not_found: {
          type: 'boolean',
          description: 'ユーザーの要望に合う商品が画像内に見つからなかった場合は true。',
        },
        recommended: {
          type: 'object',
          description:
            '比較・選びたい要望のとき、最適と判断した1商品。特定商品の検索だけの要望では省略してよい。',
          properties: {
            name: { type: 'string', description: '商品名（パッケージに書かれている名称）' },
            box_2d: {
              type: 'array',
              items: { type: 'number' },
              minItems: 4,
              maxItems: 4,
              description: boxDesc,
            },
            reason: {
              type: 'string',
              description: 'この商品を選んだ理由。ユーザーの要望に沿って具体的に、日本語で1〜2文。',
            },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          required: ['name', 'box_2d', 'reason', 'confidence'],
        },
        matches: {
          type: 'array',
          description:
            '該当・候補の各個体。同じ商品が複数箇所にあれば、箇所ごとに1件ずつ（枠線もそれぞれ）。比較・選定の要望では recommended 以外の候補も含め、商品名ごとに1件ずつ入れる。',
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
                description:
                  'この商品の簡単な情報（特徴・カロリー/カフェイン等の概算、ユーザーの要望との関係）。日本語1文。比較候補では、選ばなかった理由やイチオシとの違いも簡潔に。',
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

function buildSystemPrompt(imageWidth: number, imageHeight: number): string {
  const coordHint = `画像サイズは ${imageWidth}×${imageHeight} ピクセルです。原点 (0,0) は左上、x は右方向、y は下方向です。
box_2d は各商品パッケージをぴったり囲む [x_min, y_min, x_max, y_max] のピクセル座標で返してください。0〜1000 の正規化座標は使わないでください。`;

  return `あなたはコンビニ・スーパーの棚を撮影した写真を見て、ユーザーの要望に応える商品アシスタントです。
${coordHint}
必ず画像に実際に写っている商品だけを対象にし、写っていない商品を推測で答えないでください。
該当する部分に枠線をつけてください。同じ商品が複数箇所にある場合は、全てに枠線をつけてください（matches に1箇所1件ずつ入れる）。

要望の内容に応じて次のように対応してください。
- 特定の商品を探す要望（色・銘柄名・見た目など）→ matches に該当商品を全て入れる。recommended は省略してよい。
- 比較して選びたい要望（カロリー・カフェイン・おすすめ・どれがいいなど）→ 最も合う1つを recommended に選び、比較候補を matches に含める。各候補には note を付ける。

似た色・形の別商品と取り違えないよう、パッケージの文字やロゴまで注意深く見て判断してください。
栄養成分などの数値に触れる場合は、一般知識に基づく概算として述べ、「〜と思われます」程度のトーンにしてください。
結果は必ず ${TOOL_NAME} ツールの呼び出しとして返し、それ以外の文章は出力しないでください。`;
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
    throw new ClaudeConfigError(
      'ANTHROPIC APIキーが設定されていません。.env の EXPO_PUBLIC_ANTHROPIC_API_KEY を設定して、開発サーバーを再起動してください。'
    );
  }

  const userText = `この写真について、次の要望に答えてください：「${query}」`;

  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: 1500,
    // claude-sonnet-5 系では temperature 指定が invalid_request になるため送らない
    system: buildSystemPrompt(imageWidth, imageHeight),
    tools: [buildAnalysisTool(imageWidth, imageHeight)],
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
  } catch (e) {
    throw new ClaudeApiError('APIへの通信に失敗しました。ネットワーク接続を確認してください。');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = `APIエラー（${res.status}）`;
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
    throw new ClaudeApiError('AIの応答から解析結果を取得できませんでした。もう一度お試しください。');
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
