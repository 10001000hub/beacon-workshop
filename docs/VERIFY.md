# VERIFY — Working MVP 検証報告

- 対象: ブランチ `feat/working-mvp`、検証済みの実装 SHA **`db85a3d`**（`662c482` のコードに、WebKit で失敗した E2E 1 件のクリップボード権限の扱いを直すテスト修正を加えたもの）。その後の docs のみのコミットは、この検証の対象コードを変えない。リポジトリは公開済み（https://github.com/10001000hub/beacon-workshop ）だが、**アプリはデプロイしていない**
- CI: **GitHub Actions run 36622604662 が `db85a3d` で success**（2026-09-30 観測）。job `check`（Chromium: typecheck、143 unit tests、validate:content、build、E2E 34 passed）と job `webkit`（E2E 34 passed）がともに success。直前の run 36621920030（`dd298db`）は `check` success / `webkit` **failure**（`ui.spec.ts` の practice cards テストが WebKit にない `clipboard-write` 権限を付与しようとして失敗。アプリの不具合ではなくテストの問題。33/34 は成功）で、上記の修正で解消した。それ以前の run は古いコミットの証拠であり使わない。この docs コミット自体の run は追跡しない
- 実行日: 2026-09-30 / 環境: WSL2 Linux, Node 22.23.1, npm 10.9.8, Playwright 1.61.0 Chromium（WebKit ブラウザは取得できたが、この環境に必要な OS ライブラリがなく sudo も使えないため起動できない）
- 実行結果（`662c482` のコードで `npm run check`、終了コード 0）: typecheck 成功 / `npm test` 8 files, 143 tests passed / `npm run validate:content` OK（6 quests, 18 activities）/ `npm run build` 成功 / `npm run test:e2e` 34 passed (chromium)
- クリーン clone での再現（AC29）: **PASS**（2026-10-01、`092cd77`。下表 AC29）
- 状態の意味: **PASS** = 記載の方法で実際に確認した / **FAIL** = 確認して不合格 / **NOT RUN** = 自動で実行できるのに実行していない / **DEFERRED** = 実行可能だが意図して後回し / **HUMAN_ONLY** = 人手・実機でしか確認できない / **EXTERNAL_TOOL_ONLY** = 外部の制作ツール・素材が必要。自動部分と人手部分が混在する項目は「PASS（自動部分）+ HUMAN_ONLY（…）」のように分けて書く。現在、自動で実行可能なのに NOT RUN / DEFERRED の項目は **ない**
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
| AC10 | 必須 | PASS | Unit / E2E | `storage.test.ts`: 破損・未対応版の値は通常の書き込みでバイト単位で不変、Session が blocked になり復旧は明示操作のまま。`prerc.spec.ts` B1（別タブが schemaVersion 2 / 破損 JSON を書く → 元タブで操作・課題完了しても保存値は不変、blocked-banner と復旧リンク）。`save.spec.ts`: 復旧画面・バックアップ復元 | 旧 MVP ではこの経路が上書きされ得た（レビュー B1）。修正後に新しい証拠で PASS。制限: リセット／インポート前の保護（I1）はメモリ上の保持なので、再読み込み後の最初の通常書き込みでバックアップが更新される。エクスポートが第一の保険 |
| AC11 | 必須 | PASS | Unit / E2E | `storage.test.ts`: 書き込むのは2キーのみ、ソース中に `storage.clear(` 呼び出しがない。`save.spec.ts`: 他キーが不変 | |
| AC12 | 必須 | PASS | Unit / E2E | `storage.test.ts`: 往復、許可リスト外・`__proto__` 除去、64 KiB 超・新版・不正 JSON を拒否。`save.spec.ts` export/import | |
| AC13 | 必須 | PASS | E2E / Unit | `save.spec.ts` "two tabs…": 課題完了 → 古いタブが conflict-banner、書き込み停止、再読み込み。`prerc.spec.ts` I8: 画面遷移だけでは他タブに conflict は出ず、実際の進捗でのみ conflict | 遷移では revision を上げない（保存位置は次の実質的な保存時に反映） |
| AC14 | 必須 | PASS | E2E / 文言確認 | 地図・ノート・終幕で疑似演習/読了/実習を別表示（`ui.spec.ts` reading mode: sim 0/18, read 1/6）。実習は「下書き」表示 | |
| AC15 | 必須 | PASS | 表示テスト (Chromium + CI の WebKit) | `ui.spec.ts`: 320/390/768/1440px で横スクロールなし（12画面 + 読む版）。320/390px で代表画面（クエスト概要・課題・地図・設定）の主要操作（開始リンク、送信、ヒント、カード、リセット、エクスポート）が存在し、スクロールで到達でき、幅内に収まり、他要素に覆われない（`elementFromPoint`）。320/390px で課題を実際に完了 | WebKit は CI で同じ 34 件が PASS（run 36622604662）。実機 iPhone Safari は NOT RUN |
| AC16 | 必須 | PASS | E2E（キーボードのみ） | `keyboard.spec.ts`: 18課題すべてを Tab/Enter/Space/矢印キーだけで完了（実際の Tab 移動で到達、`.click()`/`.check()` は不使用）。4種（prompt_builder / evidence_board / change_review / triage_decision）すべてを通過し 18/18 を確認。`ui.spec.ts`: `draggable` なし | Chromium のみ。スクリーンリーダーは AC17（NOT RUN） |
| AC17 | 必須 | PASS（自動部分）+ HUMAN_ONLY（手動部分） | 自動 + 手動 | 自動で確認済み: axe-core（`a11y.spec.ts`、ja/en の代表画面と結果・復旧画面で違反 0。同梱の axe-core を注入し、ネットワーク不使用）、 画面遷移で h1 にフォーカス、skip link と可視フォーカス、結果の `aria-live` 領域に文言が入る、文字サイズ 1.3、動き低減の保存 | スクリーンリーダー（VoiceOver/NVDA）とブラウザ 200% 拡大の手動確認は人手でのみ可能。未実施 |
| AC18 | RC 条件 | PASS（機械検査）+ HUMAN_ONLY（母語話者の校閲） | 教材チェック | 全 `LocalizedText`（6 クエスト、実習、用語、物語、出典、経路）に英語がある（`content.test.ts` "English content coverage"）。UI キー・プレースホルダも全件一致（`i18n.test.ts`）。英語 UI で採点が同じことも確認済み | 英訳は作成者による初訳で、母語話者の校閲は受けていない（NOT RUN）。残った日本語断片は `lang="ja"` で示される |
| AC19 | 必須 | PASS | Unit / E2E | `i18n.test.ts`: 言語に依存せず採点が同じ。`ui.spec.ts`: 英語切替で進捗不変 | |
| AC20 | 必須（内容）/ 実機は RC | PASS（内容チェック）+ HUMAN_ONLY（実機で手順が通ること） | 教材チェック / 実機 | `content.test.ts` + `validate.ts`: 6枚すべてに whereToAct・successExample・failureRecovery がある | 内容チェックは PASS。Windows の実 Codex で 6 件の実習を通す確認は人手でのみ可能で、未実施 |
| AC21 | RC 条件 | HUMAN_ONLY | 実機確認 | 経路の testedAt / testedProductVersion は null、スクリーンショットなし（テストで確認） | Windows の実 Codex での経路確認が必要。testedAt / testedProductVersion は null のまま（捏造しない） |
| AC22 | 必須（仕様上 Device / sample） | PASS（見本と自動テスト）+ HUMAN_ONLY（実 Codex での実習） | 見本テスト | `public/practice/q04-broken-sample/`（別の保存キー `beacon-notes-q04-broken-sample.v1`、`check.mjs` 7 ケース）。`fixture.test.ts` で不具合の再現・修正後の合格・通常題名の維持・保存キーの隔離を確認、`rc.spec.ts` でブラウザ上の再現を確認 | 見本は自動テストで検証済み。実際の Codex でこの見本を使った実習は未検証（実習カードは `draft` のまま） |
| AC23 | 必須 | PASS | 表示 / 文言 | `ui.spec.ts` "simulation banner is on every screen"、実習は「下書き」、`device_verified` が存在しない（`content.test.ts`） | |
| AC24 | 必須 | PASS | セキュリティテスト | `save.spec.ts`: HTML を含むノートを import しても実行・要素化されない（`__pwned` なし、img なし）。描画は textContent のみ、CSP meta | |
| AC25 | 必須 | PASS | ネットワーク / コード | E2E の外部リクエスト 0 件。`src` に fetch / XMLHttpRequest / sendBeacon / WebSocket / password 入力なし（grep） | |
| AC26 | 必須 | PASS | CI 設定 / 実行 | `.github/workflows/ci.yml`（npm ci → Chromium → typecheck/test/validate/build/e2e、失敗時のみトレース保存、AI・有料 API・secret なし）。GitHub Actions run 36622604662 が `db85a3d` で success（`check` と `webkit` の両 job）。旧 run 36498603515 は `c4d44a9`（MVP 時点） | 初回 run 36498169680 は skip link の遷移待ち不足で e2e 1件 FAIL → テストを修正して解消 |
| AC27 | RC 条件（最終素材） | EXTERNAL_TOOL_ONLY | 台帳 / 表示 | `asset-manifest.json` に20件（MAP01, BG01–06, CH01–09, FX01, LOGO01, ICONS01, BADGES01）、全ファイル存在、alt あり、`status: placeholder`、SVG にスクリプト・外部参照なし | 最終アートは画像制作手段（または提供素材）が必要。自動では完了扱いにしない。台帳と代替表示は確認済み |
| AC28 | 必須 | PASS | 報告照合 | 本表。未実施項目を PASS と書いていない | |
| AC29 | 必須 | PASS | clean environment | 2026-10-01、公開 repo https://github.com/10001000hub/beacon-workshop.git を新規 scratch ディレクトリへ `git clone`、`feat/working-mvp` の `092cd77` をチェックアウト。既存の node_modules・dist・Playwright 設定は持ち込まず、`npm ci`（0 vulnerabilities）→ `npx playwright install chromium` → `npm run check`（typecheck → 143 unit tests → validate:content「6 quests, 18 activities」→ build → Chromium E2E 34 passed）が exit 0 | 制限: Playwright のブラウザキャッシュ（`~/.cache/ms-playwright`）はローカルと共用（`install chromium` は既存キャッシュを再利用）。同じマシン・同じ OS であり、別マシン・Windows での再現ではない。docs のみの後続コミットでこの結果は変わらない |
| AC30 | 公開前 | PASS | 差分 / grep | 2026-10-01 に `db85a3d` 以降の追跡ファイル108件を再走査: API キー・トークン・秘密鍵・パスワード代入、個人メール、ローカル絶対パスのパターンなし。画像・ログ・スクリーンショットは追跡されていない（`public/assets` は仮 SVG 20件）。`src` に fetch / XHR / sendBeacon / WebSocket / password 入力 / `localStorage.clear()` / innerHTML の使用なし（コメントでの言及のみ） | 公開済み |

## 未実施のブラウザ確認（§17.3）
- Playwright WebKit: ローカルは OS ライブラリ導入に sudo が必要で実行不可（EXTERNAL_TOOL_ONLY。CI が代替）。**CI（ubuntu-latest）では `db85a3d` で 34 passed（run 36622604662）= PASS**。WebKit エンジンの自動テストであり、実機 iPhone Safari の代わりにはならない
- 実機 iPhone Safari: HUMAN_ONLY（未実施。実機が必要）
- Windows 上の実習経路: HUMAN_ONLY（未実施）

## pre-RC 修正で追加した確認（`aebbef8`）
- B1 / I1 / I8: `storage.test.ts`、`prerc.spec.ts`（別タブ書き込み、リセット後のバックアップ保持と復元、遷移だけでは conflict なし）
- I2 / I4: `grading.test.ts`（Q06-A の 4^4 × 3^4 全数探索で正解は1通り、理由違いの個別フィードバック、Q05-A の不十分な v0.4 記録）
- I3: `state.test.ts`（レベル3ヒント後も XP は通常、再回答で二重付与なし、maxHintLevel 保持）、`prerc.spec.ts`（「解答例を見て完了」表示）
- I5: `prerc.spec.ts`（リセット確認は Cancel にフォーカス、キャンセルでトリガーに戻る）
- I6: `langMark.test.ts`、`prerc.spec.ts`（英語 UI で日本語本文に `lang="ja"`、英語 UI の文字は対象外）。制限: `aria-label` などの属性と `document.title` には言語を付けられない
- 未確認のまま（HUMAN_ONLY）: iPhone Safari 実機 / Windows 実 Codex / スクリーンリーダー / 200% 拡大 / 母語話者の英語校閲。EXTERNAL_TOOL_ONLY: 最終アート

## RC 作業で追加した確認（`a8dd34b`、`662c482`）
- アクセシビリティ（自動）: `a11y.spec.ts`（axe-core 4.13.0 を node_modules から注入）。修正した違反: region、color-contrast、heading-order、landmark-unique（`--control-line` 追加、`.pin.locked` 色、バナーに `role=region` と `aria-label`）。ja / en 各 1 本 + 結果・復旧画面
- AC18: 英語教材（クエスト 6、実習、用語、物語、出典、経路）と網羅テスト
- AC22: Q04 壊れた練習用見本と検査（上表）
- WebKit: CI PASS（上記）、ローカルは EXTERNAL_TOOL_ONLY。未実施のまま（HUMAN_ONLY）: 実機 iPhone Safari、Windows 実 Codex での実習 6 件（AC20/AC21）、VoiceOver/NVDA、人手の 200% 拡大、母語話者による英語校閲、最終アート（AC27）
