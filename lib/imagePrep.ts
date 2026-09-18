import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { t } from './i18n';
import { resizedSize } from './visionCoords';

export interface PreparedImage {
  /** API に送ったものと同じファイル。結果画面の枠重ねにもこれを使う */
  uri: string;
  base64: string;
  mediaType: 'image/jpeg';
  width: number;
  height: number;
}

/**
 * API送信用に画像を Claude がそのまま見るサイズへリサイズする。
 * EXIF 向きもここで焼き付けるため、結果画面の枠表示もこの URI / 寸法を使うこと。
 *
 * @see https://platform.claude.com/docs/en/build-with-claude/vision-coordinates
 */
export async function prepareImageForApi(uri: string): Promise<PreparedImage> {
  // EXIF 向きを焼き付け（アクションなしでも JPEG 変換で向きが正規化される）
  const oriented = await manipulateAsync(uri, [], {
    compress: 1,
    format: SaveFormat.JPEG,
  });

  const [targetW, targetH] = resizedSize(oriented.width, oriented.height);

  const needsResize = oriented.width !== targetW || oriented.height !== targetH;
  const result = needsResize
    ? await manipulateAsync(oriented.uri, [{ resize: { width: targetW, height: targetH } }], {
        compress: 0.75,
        format: SaveFormat.JPEG,
        base64: true,
      })
    : await manipulateAsync(oriented.uri, [], {
        compress: 0.75,
        format: SaveFormat.JPEG,
        base64: true,
      });

  if (!result.base64) {
    throw new Error(t('errorImageConvert'));
  }

  return {
    uri: result.uri,
    base64: result.base64,
    mediaType: 'image/jpeg',
    width: result.width,
    height: result.height,
  };
}
