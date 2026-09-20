import { NativeModules, Platform, Settings } from 'react-native';

export type AppLocale = 'ja' | 'en';

/**
 * 端末の「優先言語」を取る。
 * - Intl は iOS で「地域」寄りになりやすい
 * - NativeModules.SettingsManager は New Architecture で空になりやすい → Settings API を使う
 */
function detectLanguageTag(): string {
  if (Platform.OS === 'ios') {
    try {
      const languages = Settings.get('AppleLanguages');
      if (Array.isArray(languages) && typeof languages[0] === 'string' && languages[0]) {
        return languages[0];
      }
      const appleLocale = Settings.get('AppleLocale');
      if (typeof appleLocale === 'string' && appleLocale) {
        return appleLocale;
      }
    } catch {
      // ignore
    }
  }

  if (Platform.OS === 'android') {
    try {
      const locale =
        NativeModules.I18nManager?.localeIdentifier ??
        NativeModules.I18nManager?.getConstants?.()?.localeIdentifier;
      if (typeof locale === 'string' && locale.length > 0) return locale;
    } catch {
      // ignore
    }
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }

  try {
    const fromIntl = Intl.DateTimeFormat().resolvedOptions().locale;
    if (fromIntl) return fromIntl;
  } catch {
    // ignore
  }

  return 'en';
}

export function getAppLocale(): AppLocale {
  const tag = detectLanguageTag().toLowerCase().replace(/_/g, '-');
  return tag === 'ja' || tag.startsWith('ja-') ? 'ja' : 'en';
}

export function isJapanese(): boolean {
  return getAppLocale() === 'ja';
}

type Vars = Record<string, string | number>;

const ja = {
  freeRemaining: '無料残り {remaining}/{limit} 回',
  premium: 'プレミアム',
  premiumActive: 'プレミアム利用中',
  freeLimitTitle: '無料枠を使い切りました',
  freeLimitBody: 'プレミアムに加入すると、何度でも棚を解析できます。',
  continueWithPremium: 'プレミアムで続ける',
  apiKeyMissingTitle: '⚠️ APIキー未設定',
  apiKeyMissingBody:
    '.env に EXPO_PUBLIC_ANTHROPIC_API_KEY を設定して開発サーバーを再起動してください。詳しくは README をご覧ください。',
  sectionPhoto: '1. 棚の写真',
  sectionQuery: '2. 要望',
  retakePhoto: '📷 撮り直す',
  rechoosePhoto: '🖼️ 選び直す',
  pickerTitle: '棚の写真を用意しよう',
  pickerSubtitle: '商品パッケージがはっきり写るように撮ってね',
  takePhoto: '写真を撮る',
  pickFromLibrary: 'ライブラリから選ぶ',
  queryPlaceholder: '例：緑のモンスターはどこ？ / 一番カロリーが低いお菓子は？',
  dismiss: '閉じる',
  search: 'さがす',
  loadingHint: 'AIが棚を確認しています…（数秒〜10秒ほど）',
  photoLibraryPermissionTitle: '写真ライブラリへのアクセスが必要です',
  photoLibraryPermissionBody: '設定アプリから許可してください。',
  cameraPermissionTitle: 'カメラへのアクセスが必要です',
  cameraPermissionBody: '設定アプリから許可してください。',

  emptyResult: '結果がありません。トップに戻ってやり直してください。',
  backToTop: 'トップへ戻る',
  back: '← 戻る',
  notFoundFallback: '見つかりませんでした。',
  notFoundTitle: '🙈 見つかりませんでした',
  notFoundBody: '言葉を変えてみるか、パッケージがはっきり写る角度でもう一度撮影してみてください。',
  recommendedLabel: '🎯 イチオシ',
  otherCandidates: '比較した他の候補',
  foundProducts: '見つかった商品',
  askAgain: 'もう一度きく',
  changePhoto: '写真を変える',

  aiJudgment: '🤖 AI判断',
  productDisclaimer: '商品名・理由・数値はAIの判断です。正確な情報は必ずパッケージをご確認ください。',

  close: '閉じる',
  closeWithX: '✕ 閉じる',
  pinchHint: '2本指でピンチして拡大・縮小',
  resultImageA11y: '結果画像を拡大表示',

  paywallUnavailableTitle: 'Paywallを表示できません',
  paywallUnavailableBody:
    'RevenueCat の API キー未設定、または Web / Expo Go では課金UIを開けません。開発ビルド（npx expo run:ios）で試してください。',
  paywallErrorBody:
    'Paywallの表示に失敗しました。開発ビルドで起動しているか、RevenueCat の Current Offering / Paywall 設定を確認してください。',

  errorNeedPhoto: 'まず写真を選んでください。',
  errorNeedQuery: '要望を入力してください。',
  errorFreeLimitReached:
    '無料枠（{limit}回）を使い切りました。プレミアムに加入すると続けて使えます。',
  errorUnexpected: '解析中に予期しないエラーが発生しました。もう一度お試しください。',
  errorNoApiKey:
    'ANTHROPIC APIキーが設定されていません。.env の EXPO_PUBLIC_ANTHROPIC_API_KEY を設定して、開発サーバーを再起動してください。',
  errorNetwork: 'APIへの通信に失敗しました。ネットワーク接続を確認してください。',
  errorNoToolResult: 'AIの応答から解析結果を取得できませんでした。もう一度お試しください。',
  errorImageConvert: '画像の変換に失敗しました。',

  suggestions: [
    '緑のモンスターはどこ？',
    '一番カロリーが低いお菓子は？',
    '黄色いパッケージはどれ？',
    '眠い、一番効くのはどれ？',
    'じゃがりこはどこ？',
    '甘いものが欲しい',
  ],
} as const;

const en: { [K in keyof typeof ja]: (typeof ja)[K] extends readonly string[] ? string[] : string } = {
  freeRemaining: 'Free left {remaining}/{limit}',
  premium: 'Premium',
  premiumActive: 'Premium active',
  freeLimitTitle: 'Free searches used up',
  freeLimitBody: 'Go Premium to search shelves as many times as you want.',
  continueWithPremium: 'Continue with Premium',
  apiKeyMissingTitle: '⚠️ API key missing',
  apiKeyMissingBody:
    'Set EXPO_PUBLIC_ANTHROPIC_API_KEY in .env and restart the dev server. See the README for details.',
  sectionPhoto: '1. Shelf photo',
  sectionQuery: '2. What you’re looking for',
  retakePhoto: '📷 Retake',
  rechoosePhoto: '🖼️ Choose again',
  pickerTitle: 'Add a shelf photo',
  pickerSubtitle: 'Make sure product packages are clearly visible',
  takePhoto: 'Take photo',
  pickFromLibrary: 'Choose from library',
  queryPlaceholder: 'e.g. Where’s the green Monster? / Lowest-calorie snack?',
  dismiss: 'Dismiss',
  search: 'Search',
  loadingHint: 'Checking the shelf… (a few seconds)',
  photoLibraryPermissionTitle: 'Photo library access needed',
  photoLibraryPermissionBody: 'Please allow access in Settings.',
  cameraPermissionTitle: 'Camera access needed',
  cameraPermissionBody: 'Please allow access in Settings.',

  emptyResult: 'No result yet. Go back and try again.',
  backToTop: 'Back to home',
  back: '← Back',
  notFoundFallback: 'Nothing found.',
  notFoundTitle: '🙈 Nothing found',
  notFoundBody: 'Try different words, or retake the photo so packages are clearer.',
  recommendedLabel: '🎯 Top pick',
  otherCandidates: 'Other options compared',
  foundProducts: 'Products found',
  askAgain: 'Ask again',
  changePhoto: 'Change photo',

  aiJudgment: '🤖 AI pick',
  productDisclaimer: 'Names, reasons, and numbers are AI estimates. Always check the package.',

  close: 'Close',
  closeWithX: '✕ Close',
  pinchHint: 'Pinch with two fingers to zoom',
  resultImageA11y: 'Expand result image',

  paywallUnavailableTitle: 'Can’t show paywall',
  paywallUnavailableBody:
    'RevenueCat API key missing, or billing UI isn’t available in Web / Expo Go. Try a development build (npx expo run:ios).',
  paywallErrorBody:
    'Failed to show the paywall. Make sure you’re on a development build and that RevenueCat Current Offering / Paywall is set up.',

  errorNeedPhoto: 'Please choose a photo first.',
  errorNeedQuery: 'Please enter what you’re looking for.',
  errorFreeLimitReached: 'You’ve used your {limit} free searches. Go Premium to continue.',
  errorUnexpected: 'Something went wrong while analyzing. Please try again.',
  errorNoApiKey:
    'ANTHROPIC API key is not set. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to .env and restart the dev server.',
  errorNetwork: 'Couldn’t reach the API. Check your network connection.',
  errorNoToolResult: 'Couldn’t read the AI result. Please try again.',
  errorImageConvert: 'Failed to process the image.',

  suggestions: [
    'Where’s the green Monster?',
    'Lowest-calorie snack?',
    'Which ones are in a yellow pack?',
    'I’m sleepy — what works best?',
    'Where’s the Jagariko?',
    'I want something sweet',
  ],
};

const catalogs = { ja, en } as const;

export type StringKey = Exclude<keyof typeof ja, 'suggestions'>;

function format(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}

export function t(key: StringKey, vars?: Vars): string {
  const locale = getAppLocale();
  return format(catalogs[locale][key], vars);
}

export function getSuggestions(): string[] {
  return [...catalogs[getAppLocale()].suggestions];
}

/** Claude 向け: ユーザー向け文章の言語名 */
export function getResponseLanguageName(): 'Japanese' | 'English' {
  return isJapanese() ? 'Japanese' : 'English';
}
