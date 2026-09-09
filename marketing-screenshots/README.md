# Buy it! — App Store スクリーンショット

App Store / App Store Connect 向けのマーケティングスクリーンショット生成プロジェクトです。

## すぐ使う（App Store Connect にアップロード）

| デバイス | サイズ | 日本語 | 英語 |
|---------|--------|--------|------|
| iPhone | 1320×2868 | `exports/iphone/ios/iphone/1320x2868/ja/` | `.../en/` |
| iPad | 2064×2752 | `exports/ipad/ios/ipad/2064x2752/ja/` | `.../en/` |

ZIP も同フォルダにあります: `exports/buy-it-iphone.zip`, `exports/buy-it-ipad.zip`

## エディタで編集する

```bash
cd marketing-screenshots
npm install --legacy-peer-deps
npm run dev
# → http://localhost:3000
```

ブラウザでコピー・レイアウト・色を調整し、**Export bundle** で再出力できます。

## 再生成

```bash
# アプリUIのモック画像を作り直す（実機スクショに差し替える場合は public/screenshots/... を直接置き換え）
npm run generate-mocks

# dev サーバー起動中に一括エクスポート
npm run dev   # 別ターミナル
npm run export-all
```

## デザイン

- テーマ: **Buy it! Warm**（生成り `#FAF7F2` + コーラル `#FF6B3D`）
- iPhone 6枚 / iPad 4枚（日本語・英語）

## 実機スクショに差し替える場合

`public/screenshots/apple/iphone/ja/` などに PNG を置き、`app-store-screenshots.json` のパスを更新してから再エクスポートしてください。
