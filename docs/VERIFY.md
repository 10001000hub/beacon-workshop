# VERIFY — Working MVP 検証報告

- 対象: ブランチ `feat/working-mvp`（コード最終コミット `4aa6f05` + WP07 文書コミット）
- 実行日: 2026-09-29 / 環境: WSL2 Linux, Node 22.23.1, npm 10.9.8, Playwright 1.61.0 Chromium（WebKit は未導入）
- 実行結果: `npm run typecheck` 成功 / `npm test` 6 files, 119 tests passed / `npm run validate:content` OK（6 quests, 18 activities）/ `npm run build` 成功 / `npm run test:e2e` 20 passed (chromium)
- 新しい作業場所での再現: `git clone` → `npm ci` → typecheck / test / validate / build / `CI=true npx playwright test` がすべて成功（スクラッチ領域に clone）。ただし Playwright のブラウザキャッシュは同一マシンのものを共用
- 状態の意味: **PASS** = 記載の方法で実際に確認した / **FAIL** = 確認して不合格 / **NOT RUN** = 必要な確認を実行していない / **DEFERRED TO RELEASE CANDIDATE** = 仕様上 RC 条件、または MVP で素材・機材がない。一部だけ確認できた項目は弱い方の状態にし、確認済みの部分を備考に書く
- 実機（iPhone Safari、Windows、実際の Codex）での確認は一切していない。自動テストは実機検証の代わりにならない

| AC ID | MVP relevance | Status | Method | Evidence | Notes |
|---|---|---|---|---|---|
| AC01 | 必須 | PASS | E2E + 外部リクエスト監視 | `playthrough.spec.ts` "a Japanese learner plays…": タイトル → 開始 → 導入 → 最初の課題。127.0.0.1 以外へのリクエストが 0 件であることを検査 | ログイン・API キー入力欄は存在しない（AC25 参照） |
| AC02 | 必須 | PASS | E2E | 同上: Q01〜Q06 の18課題 → 各クリア画面で取得カード3枚 → 終幕。18/18、600/600、Lv.7 を確認 | Chromium のみ |
| AC03 | 必須 | PASS | Unit / content / E2E | `grading.test.ts`: 全課題の全 accepted 組合せが correct、宣言済み誤答 outcome が2手以内で到達可能かつフィードバックあり、判定が決定的。`playthrough.spec.ts` "every quest also accepts its alternative correct answers" | 自由記述は採点対象外（`grading.test.ts` で確認） |
| AC04 | 必須 | PASS | Unit / E2E | `grading.test.ts`: Q05-C/Q06-C で proceed が正解、同じ案件で fix_now は不正解。E2E 通し攻略でも正常案件を進めて完了 | |
| AC05 | 必須 | PASS | Unit / E2E | `state.test.ts`: ヒントは XP・進捗を変えない、読む版は完了にならない。`ui.spec.ts` "reading mode…": 疑似演習 0/18, XP 0/600。E2E で誤答1回 + ヒント後も XP 満額 | |
| AC06 | 必須 | PASS | Unit / E2E | `state.test.ts`: 二重付与なし（XP は完了記録から導出）。E2E: リロード後・復習後も 600、英語切替後も進捗不変（`ui.spec.ts` settings） | |
| AC07 | 必須 | PASS | Unit / content | `content.test.ts`: 18課題、6実習、18×20+6×40=600。`state.test.ts`: 上限・レベル表 | |
| AC08 | 必須 | PASS | E2E / Unit | `save.spec.ts` "progress persists across reload…"、`playthrough.spec.ts` のリロード確認、`state.test.ts` resume | |
| AC09 | 必須 | PASS | 障害注入 (E2E / Unit) | `save.spec.ts`: setItem 例外 → memory-banner で続行、localStorage getter 例外 → メモリモードで起動。`storage.test.ts` write_failed / retry | |
| AC10 | 必須 | PASS | Unit / E2E | `save.spec.ts`: 破損セーブを保持したまま復旧画面 → バックアップ復元、未知の新しい版は保護され「保存せず続行」でも上書きしない | |
| AC11 | 必須 | PASS | Unit / E2E | `storage.test.ts`: 書き込むのは2キーのみ、ソース中に `storage.clear(` 呼び出しがない。`save.spec.ts`: 他キーが不変 | |
| AC12 | 必須 | PASS | Unit / E2E | `storage.test.ts`: 往復、許可リスト外・`__proto__` 除去、64 KiB 超・新版・不正 JSON を拒否。`save.spec.ts` export/import | |
| AC13 | 必須 | PASS | E2E / Unit | `save.spec.ts` "two tabs…": revision + storage イベントで古いタブが書き込み停止、conflict-banner、再読み込み | |
| AC14 | 必須 | PASS | E2E / 文言確認 | 地図・ノート・終幕で疑似演習/読了/実習を別表示（`ui.spec.ts` reading mode: sim 0/18, read 1/6）。実習は「下書き」表示 | |
| AC15 | 必須 | PASS | 表示テスト (Chromium) | `ui.spec.ts` "no horizontal page scroll at 320/390/768/1440px"（12画面 + 読む版） | WebKit・実機での表示は NOT RUN（§17.3、RC 前に必要） |
| AC16 | 必須 | PASS | E2E（キーボードのみ） | `ui.spec.ts` "keyboard only: complete Q01-A…"、タブの矢印キー操作、`draggable=true` が存在しない。4種の操作部品はすべてボタン/ラジオ/チェックで構成 | キーボードのみで18課題を通す E2E は Q01-A のみ。他は同じ部品を使用。手動の全課題確認は NOT RUN |
| AC17 | 必須 | NOT RUN | 自動 + 手動 | 自動で確認済み: 画面遷移で h1 にフォーカス、skip link と可視フォーカス、結果の `aria-live` 領域に文言が入る、文字サイズ 1.3、動き低減の保存 | スクリーンリーダー（VoiceOver/NVDA）とブラウザ 200% 拡大の手動確認は未実施 |
| AC18 | RC 条件 | DEFERRED TO RELEASE CANDIDATE | 教材チェック | 日本語は全教材あり。英語は UI キー全件一致（`content.test.ts` / `i18n.test.ts`）、教材本文は日本語にフォールバック | 英語教材・実習文面は RC |
| AC19 | 必須 | PASS | Unit / E2E | `i18n.test.ts`: 言語に依存せず採点が同じ。`ui.spec.ts`: 英語切替で進捗不変 | |
| AC20 | 必須（内容）/ 実機は RC | DEFERRED TO RELEASE CANDIDATE | 教材チェック / 実機 | `content.test.ts` + `validate.ts`: 6枚すべてに whereToAct・successExample・failureRecovery がある | 内容チェックは PASS。実機で手順が通ることは未確認のため全体は RC |
| AC21 | RC 条件 | DEFERRED TO RELEASE CANDIDATE | 実機確認 | 経路の testedAt / testedProductVersion は null、スクリーンショットなし（テストで確認） | 捏造しないことを優先。実機検証は RC |
| AC22 | 必須（仕様上 Device / sample） | DEFERRED TO RELEASE CANDIDATE | 実機 / 見本テスト | Q04 の実習カードは「同じ不具合がない場合は正しいコードをわざと壊さない」と案内するが、壊れた見本リポジトリ自体は未作成 | 見本フィクスチャと実機確認が必要 |
| AC23 | 必須 | PASS | 表示 / 文言 | `ui.spec.ts` "simulation banner is on every screen"、実習は「下書き」、`device_verified` が存在しない（`content.test.ts`） | |
| AC24 | 必須 | PASS | セキュリティテスト | `save.spec.ts`: HTML を含むノートを import しても実行・要素化されない（`__pwned` なし、img なし）。描画は textContent のみ、CSP meta | |
| AC25 | 必須 | PASS | ネットワーク / コード | E2E の外部リクエスト 0 件。`src` に fetch / XMLHttpRequest / sendBeacon / WebSocket / password 入力なし（grep） | |
| AC26 | 必須 | NOT RUN | CI 設定 / 実行 | `.github/workflows/ci.yml` を追加（npm ci → Chromium → typecheck/test/validate/build/e2e、AI・有料 API・secret なし）。同じ手順をローカルの clean clone で実行し成功 | リモート未作成のため GitHub Actions では未実行 |
| AC27 | RC 条件（最終素材） | DEFERRED TO RELEASE CANDIDATE | 台帳 / 表示 | `asset-manifest.json` に20件（MAP01, BG01–06, CH01–09, FX01, LOGO01, ICONS01, BADGES01）、全ファイル存在、alt あり、`status: placeholder`、SVG にスクリプト・外部参照なし | 台帳と代替表示は MVP で確認済み。最終アートと使用条件は RC |
| AC28 | 必須 | PASS | 報告照合 | 本表。NOT RUN / DEFERRED を PASS と書いていない | |
| AC29 | 必須 | PASS | clean environment | clone → `npm ci` → 全コマンド成功（上記） | 別マシン・Windows ではない。ブラウザキャッシュは共用 |
| AC30 | 公開前 | PASS | 差分 / grep | 追跡ファイル87件に API キー・パスワード・秘密鍵・個人メール・ローカル絶対パスのパターンなし。学習ログ・スクリーンショットなし | 公開直前に再確認すること（公開は未実施） |

## 未実施のブラウザ確認（§17.3）
- Playwright WebKit: 未導入のため NOT RUN
- 実機 iPhone Safari: NOT RUN（公開前に必須）
- Windows 上の実習経路: NOT RUN（RC）
