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

**Working MVP + pre-RC 修正**（ブランチ `feat/working-mvp`）。リポジトリは公開されていますが、**アプリはデプロイされていません**（公開ページはありません）。導入 → Q01〜Q06（必須課題18）→ 終幕までを日本語で一周できます。英語は UI 文字列のみで、教材本文は日本語で表示されます。英語教材、最終アート、実習の実機検証は Release Candidate の範囲です。詳細は [docs/VERIFY.md](docs/VERIFY.md) と [docs/HANDOFF.md](docs/HANDOFF.md) を参照してください。

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

`dist/` は静的ファイルのみです。静的サーバー（例: `npm run preview`）で配信して開いてください。`index.html` をダブルクリックして開く方法（`file://`）は確認していないため、対応をうたっていません。

## 既知の制限

- 英語は UI 文字列のみで、教材本文は日本語で表示されます（英語 UI では日本語部分に `lang="ja"` を付けています）。
- 検証は Chromium の自動テストのみです。WebKit・iPhone Safari・Windows・スクリーンリーダー・実際の Codex での確認は未実施です。
- リセット／インポート前のバックアップ保護は、ページを再読み込みするまでの間の保持です。大事な進捗は設定画面のエクスポートで控えてください。
- CI: `.github/workflows/ci.yml`（GitHub Actions）。結果は各コミットごとに確認してください。

## 貢献・セキュリティ

[CONTRIBUTING.md](CONTRIBUTING.md) と [SECURITY.md](SECURITY.md) を参照してください。

## 仕様

正本は [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) です。

## ライセンス

[MIT License](LICENSE)
