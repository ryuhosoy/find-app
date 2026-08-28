import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface PreparedImage {
  /** API に送ったものと同じファイル。結果画面の枠重ねにもこれを使う */
  uri: string;
  base64: string;
  mediaType: 'image/jpeg';
  width: number;
  height: number;
}

/**
 * API送信用に画像を縮小・圧縮する。トークン量とレイテンシを抑えつつ、
 * 商品パッケージの文字が判別できる程度の解像度（長辺1280px）を確保する。
 *
 * 向き（EXIF）もここで焼き付けるため、結果画面の枠表示もこの URI / 寸法を使うこと。
 * 元画像のまま重ねると向きや比率の差で枠がズレる。
 */
export async function prepareImageForApi(uri: string): Promise<PreparedImage> {
  const result = await manipulateAsync(uri, [{ resize: { width: 1280 } }], {
    compress: 0.75,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!result.base64) {
    throw new Error('画像の変換に失敗しました。');
  }

  return {
    uri: result.uri,
    base64: result.base64,
    mediaType: 'image/jpeg',
    width: result.width,
    height: result.height,
  };
}
