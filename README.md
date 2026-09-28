# Beacon Workshop

港町ルーメンを舞台に、Codex との協働の考え方（依頼の組み立て・根拠の確認・変更の見直し・進めるか止めるかの判断）を練習する、物語つきの学習アドベンチャーです。

## 大事なこと

- **非公式の作品です。** OpenAI およびその製品とは関係がありません。
- **ゲーム内の画面は練習用のシミュレーションで、実際の Codex ではありません。** アプリは Codex を実行せず、どんな AI・API も呼び出しません。
- 採点はブラウザ内で決まった規則により行います。自由記述は採点しません。
- **進捗はこのブラウザの localStorage（`beacon-workshop.save.v1` / `beacon-workshop.backup.v1`）にだけ保存されます。** 外部送信・解析・広告・ログインはありません。
- 実習カード（本物の Codex で試す手順）は**下書き**で、実機では未検証です。
- 画像はすべて仮素材です。

## 現在の状態

**Working MVP**（ブランチ `feat/working-mvp`）。導入 → Q01〜Q06（必須課題18）→ 終幕までを日本語で一周できます。英語は UI 文字列のみで、教材本文は日本語で表示されます。英語教材、最終アート、実習の実機検証は Release Candidate の範囲です。詳細は [docs/VERIFY.md](docs/VERIFY.md) と [docs/HANDOFF.md](docs/HANDOFF.md) を参照してください。

## コマンド

Node.js 22 以上が必要です。

```sh
npm ci                              # 依存を lockfile どおりに導入
npx playwright install chromium     # E2E 用ブラウザ（初回のみ）
npm run dev                         # 開発サーバー
npm test                            # 単体・教材テスト（Vitest）
npm run validate:content            # 教材データの検証
npm run build                       # 型検査 + 本番ビルド（dist/）
npm run test:e2e                    # Playwright E2E（ビルドして 127.0.0.1:4173 で preview）
npm run check                       # 上記すべて
```

`dist/` は静的ファイルのみで、`index.html` を相対パスで配信できます（ハッシュルーティング）。

## 仕様

正本は [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) です。ライセンスは公開前にオーナーが決定します（未設定）。
