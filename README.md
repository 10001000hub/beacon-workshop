# Beacon Workshop

港町ルーメンを舞台に、Codex との協働の考え方（依頼の組み立て・根拠の確認・変更の見直し・進めるか止めるかの判断）を練習する、物語つきの学習アドベンチャーです。

## 大事なこと

- **非公式の作品です。** OpenAI およびその製品とは関係がありません。
- **ゲーム内の画面は練習用のシミュレーションで、実際の Codex ではありません。** アプリは Codex を実行せず、どんな AI・API も呼び出しません。
- 採点はブラウザ内で決まった規則により行います。自由記述は採点しません。
- **進捗はこのブラウザの localStorage（`beacon-workshop.save.v1` / `beacon-workshop.backup.v1`）にだけ保存されます。** 外部送信・解析・広告・ログインはありません。
- 実習カード（本物の Codex で試す手順）は**下書き**で、実機では未検証です。
- 絵はこのプロジェクト用にコードで描いたオリジナル（紙工作風）の**候補版**で、オーナーの目視確認は未了です。制作手順と利用条件は [art/README.md](art/README.md)。

## 現在の状態

**Release Candidate（この環境で自動検証できる範囲）**。公開リポジトリの既定ブランチは `feat/working-mvp` のままで、その画像は仮素材です。**オリジナルのアート候補 20 点を含むこのコードはブランチ `feat/claude-finish-20261001`**（ベース `354d937`）にあり、レビュー待ちです（承認済みではありません）。アプリはデプロイされていません（公開ページはありません）。アートはオリジナルの候補版（オーナーの目視確認待ち）、実習の実機検証は未完了、英訳は母語話者の校閲を受けていない初訳です。詳細は [docs/VERIFY.md](docs/VERIFY.md) と [docs/HANDOFF.md](docs/HANDOFF.md)、アートの来歴は [art/README.md](art/README.md)、OSS 申請の下書き（未提出）は [docs/OSS_APPLICATION.md](docs/OSS_APPLICATION.md) を参照してください。

## コースの概要

- 導入 → Q01〜Q06（6 章・必須課題 18）→ 終幕。1 章に課題が 3 つあり、終えると地区の灯りがともります。全部で 600 XP（課題の初回完了 18×20 + 章クリア 6×40）です。実機実習は XP に加算せず、独立した記録です。
- 課題は 4 種類です: 依頼を組み立てる（prompt_builder）、根拠を集める（evidence_board）、変更を見直す（change_review）、進めるか止めるかの判断（triage_decision）。
- 採点はブラウザ内の決まった規則（決定的）で、自由記述は採点しません。選択ごとにフィードバックとヒント 3 段階があります。
- 日本語が基本で、英語の教材・UI も選べます。

## このブランチの取得

```sh
git clone https://github.com/10001000hub/beacon-workshop.git
cd beacon-workshop
git checkout feat/claude-finish-20261001   # アート候補を含むブランチ（レビュー待ち）
```

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
npx tsx scripts/generate-art.ts     # アートの SVG 原稿（art/source/）と素材台帳を再生成
npx tsx scripts/render-art.ts       # 原稿を Chromium で public/assets/art/ へ書き出し（WebP/SVG）
```

`dist/` は静的ファイルのみです。静的サーバー（例: `npm run preview`）で配信して開いてください。`index.html` をダブルクリックして開く方法（`file://`）は確認していないため、対応をうたっていません。

## 既知の制限

- 英訳は初訳で、母語話者の校閲を受けていません。英訳のない部分は日本語で表示され、`lang="ja"` を付けます。
- 検証は Chromium の自動テスト（axe-core を含む）のみです。実機 iPhone Safari（WebKit エンジンは CI で確認済み）・Windows・スクリーンリーダー・実際の Codex での確認は未実施です。アートのオーナー目視確認も未了です。
- リセット／インポート前のバックアップ保護は、ページを再読み込みするまでの間の保持です。大事な進捗は設定画面のエクスポートで控えてください。
- CI: `.github/workflows/ci.yml`（GitHub Actions）。結果は各コミットごとに確認してください。

## 貢献・セキュリティ

[CONTRIBUTING.md](CONTRIBUTING.md) と [SECURITY.md](SECURITY.md) を参照してください。

## 仕様

正本は [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) です。

## ライセンス

[MIT License](LICENSE)
