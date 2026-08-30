import type { AppMode, Confidence, RawAnalysis } from './types';
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
            '「おすすめモード」で最適と判断した1商品。「さがすモード」では基本的に省略してよい。',
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
            '該当・候補の各個体。同じ商品が複数箇所にあれば、箇所ごとに1件ずつ（枠線もそれぞれ）。おすすめモードでは recommended 以外の候補も含めてよい。',
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

function buildSystemPrompt(mode: AppMode, imageWidth: number, imageHeight: number): string {
  const coordHint = `画像サイズは ${imageWidth}×${imageHeight} ピクセルです。原点 (0,0) は左上、x は右方向、y は下方向です。
box_2d は各商品パッケージをぴったり囲む [x_min, y_min, x_max, y_max] のピクセル座標で返してください。0〜1000 の正規化座標は使わないでください。`;

  const common = `あなたはコンビニ・スーパーの棚を撮影した写真を見て、ユーザーの要望に応える商品検索アシスタントです。
${coordHint}
必ず画像に実際に写っている商品だけを対象にし、写っていない商品を推測で答えないでください。
該当する部分に枠線をつけてください。同じ商品が複数箇所にある場合は、全てに枠線をつけてください（matches に1箇所1件ずつ入れる）。
結果は必ず ${TOOL_NAME} ツールの呼び出しとして返し、それ以外の文章は出力しないでください。`;

  if (mode === 'search') {
    return `${common}
現在のモードは「さがす」です。ユーザーは色・銘柄名・見た目の特徴などで特定の商品を指定します。
似た色・形の別商品（例: 同じブランドのカラーバリエーション違い）と取り違えないよう、パッケージの文字やロゴまで注意深く見て判断してください。
該当する商品が画像内に複数個（同じ商品が並んでいる等）写っている場合は、漏らさず全て matches に含め、それぞれに枠線をつけてください。`;
  }

  return `${common}
現在のモードは「おすすめ」です。ユーザーはカロリー・カフェイン量・気分など条件や要望を伝えます。
画像内の関連しそうな商品（お菓子や飲料など）を見比べ、ユーザーの要望に最も合う1つを recommended として選び、
なぜそれを選んだのかを具体的な理由と共に答えてください。比較のために検討した他の候補も matches に含めてください。
栄養成分などの数値に触れる場合は、あなたの一般知識に基づく概算として reason や answer に含め、
断定しすぎず「〜と思われます」程度のトーンにしてください。`;
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
  mode: AppMode;
  query: string;
}

export async function analyzeShelf({
  base64Image,
  mediaType,
  imageWidth,
  imageHeight,
  mode,
  query,
}: AnalyzeShelfParams): Promise<RawAnalysis> {
  if (!hasApiKey()) {
    throw new ClaudeConfigError(
      'ANTHROPIC APIキーが設定されていません。.env の EXPO_PUBLIC_ANTHROPIC_API_KEY を設定して、開発サーバーを再起動してください。'
    );
  }

  const userText =
    mode === 'search'
      ? `この写真の中から次の商品を探してください：「${query}」`
      : `この写真に写っている商品の中から、次の要望に一番合う商品を選んでください：「${query}」`;

  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: 1500,
    // claude-sonnet-5 系では temperature 指定が invalid_request になるため送らない
    system: buildSystemPrompt(mode, imageWidth, imageHeight),
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
