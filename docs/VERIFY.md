# VERIFY — Working MVP 検証報告

- **最新の作業ブランチ（主証拠）**: `feat/claude-finish-20261001`（ベースは `354d937`。以下「この候補」）。**このブランチは画像 20 点（`public/assets/art`、`art/source`）・UI・テスト・docs を変更しており、下の履歴証拠の対象コードとは異なる。** リポジトリは公開済み（https://github.com/10001000hub/beacon-workshop ）だが、**アプリはデプロイしていない**
- **最新（この候補）**: ルートが実際の終了コード 0 で全段階を検証済み（2026-10-01 08:16:44 UTC 完了、1 ワーカー）: typecheck、146 unit/content tests、validate:content（6 quests, 18 activities）、build、Chromium E2E 34 件。これは**下記の肖像オフセット修正より前**の実行。ルートは実コントロールで 6 章・18 課題・4 種類のボード・600 XP・終幕を完走し、再読み込み、外部リクエスト 0、pageerror 0 を確認し、自動化 Chromium のスクリーンショット 15 枚（`summary.json` 付き）を取得した（機器・人手の検証ではない）。
- 肖像の CSS のみの修正（`.portrait` の `top` を -4px → -22px。Koto は別指定のまま）後: `npm run build` 成功、同じ手順でスクリーンショット 15 枚を再生成（errors 0、外部リクエスト 0、6 章 18 課題 600 XP）。q01-mobile と q06-desktop で Nagi/Ritsu の顔が丸の中に全部収まることを目視。その後 `npx playwright test --project=chromium tests/e2e/ui.spec.ts tests/e2e/a11y.spec.ts --workers=1` を単独実行（パイプなし）: 16 passed。**フルスイートは修正後には再実行していない。**
- 以前の作業者の実測（参考）: `npm run check -- --workers=2` は出力を `tail`/`grep` 経由で見ており、`--workers=2` が反映されたとは言えない（4 ワーカーを観測）。1 回目に `playthrough.spec.ts` が 60s タイムアウトし、単独 19.5s で成功、再実行で 34 passed。
- 作業ブランチの CI: **未確認（push 後の現行 head について、ルートが確認するまで pending。CI run / PR の ID はここに記載していない）**。既知の旧ベースライン `354d937` の CI run 36782230473 は履歴としてのみ記録する（このブランチのコードの証拠ではない）
- 環境: WSL2 Linux, Node 22.23.1, Playwright 1.61.0 Chromium（キャッシュ済みを再利用。WebKit はこの環境に OS ライブラリがなく起動できない）
- 実機（iPhone Safari、Windows、実際の Codex、VoiceOver/NVDA、200% 拡大、英語の母語話者校閲）での確認は一切していない。自動テストと作業者・ルートの画面目視は、オーナーの承認や実機検証の代わりにならない

- 受け入れ項目は **30 項目中 24 項目が FULL PASS（80%）**、5 項目が自動部分 PASS + HUMAN_ONLY、1 項目が HUMAN_ONLY。これは受け入れ項目の充足率で、製品全体の完成率ではない。
- 最新画面のレビュー資料: [docs/screenshots/README.md](screenshots/README.md)。15 枚のうち地図・全6章・終幕の8枚を同梱。

## 履歴ベースライン（`feat/working-mvp` / `db85a3d` 時点。画像が仮 SVG だった旧コードの証拠であり、現在の作業ブランチには当てはまらない）
- 対象: ブランチ `feat/working-mvp`、検証済み実装 SHA `db85a3d`（`662c482` のコードに、WebKit で失敗した E2E 1 件のクリップボード権限の扱いを直すテスト修正を加えたもの）
- CI: **GitHub Actions run 36622604662 が `db85a3d` で success**（2026-09-30 観測）。job `check`（Chromium: typecheck、143 unit tests、validate:content、build、E2E 34 passed）と job `webkit`（E2E 34 passed）がともに success。直前の run 36621920030（`dd298db`）は `check` success / `webkit` **failure**（`ui.spec.ts` の practice cards テストが WebKit にない `clipboard-write` 権限を付与しようとして失敗。アプリの不具合ではなくテストの問題。33/34 は成功）で、上記の修正で解消した。それ以前の run は古いコミットの証拠であり使わない。この docs コミット自体の run は追跡しない
- （履歴）実行日: 2026-09-30 / 環境: WSL2 Linux, Node 22.23.1, npm 10.9.8, Playwright 1.61.0 Chromium（WebKit ブラウザは取得できたが、この環境に必要な OS ライブラリがなく sudo も使えないため起動できない）
- （履歴）実行結果（`662c482` のコードで `npm run check`、終了コード 0）: typecheck 成功 / `npm test` 8 files, 143 tests passed / `npm run validate:content` OK（6 quests, 18 activities）/ `npm run build` 成功 / `npm run test:e2e` 34 passed (chromium)
- クリーン clone での再現（AC29）: **履歴 PASS**（2026-10-01、`092cd77`＝画像が仮 SVG の旧コード。現在の候補の再現は下表 AC29 の通り別に記録）
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
| AC27 | RC 条件（最終素材） | PASS（自動部分）+ HUMAN_ONLY | 台帳 / 表示 / テスト | 2026-10-01、`feat/claude-finish-20261001`（この候補）。`asset-manifest.json` に20件（MAP01, BG01–06, CH01–09, FX01, LOGO01, ICONS01, BADGES01）、`status: candidate`、ja/en alt あり。`tests/content` が: 全ファイル存在、WebP 寸法（MAP 2048×1536 / BG 1920×1080 / CH 768×1024 / FX 768×768）、合計 ≤8MB（実測 1.67 MiB）、初画面分 ≤1.5MB、SVG に script/外部参照/埋め込み文字なし・XML 整形式、「仮素材/placeholder」文言なし を検査。画像失敗時の代替表示は既存の `image()` フォールバック。Chromium スクリーンショットで 320/360/1280px を作業者が目視（ルートの AI 目視確認も、オーナーの署名とは別物）。実寸は MAP 2048×1536、BG 1920×1080、CH 768×1024、FX 768×768、合計 1.67 MiB、生成コードと `art/source` を同梱。制作手段・日付・利用条件は `art/README.md` | 以前の外部素材待ちというブロッカーは、オリジナル候補 20 点の作成で解消。**オーナーの目視確認は未実施（HUMAN_ONLY）。承認・署名はない。** 実機での見え方も未確認。権利面は「オリジナルのコード描画・リポジトリと同じ MIT」までで、第三者権利の不存在の保証ではない |
| AC28 | 必須 | PASS | 報告照合 | 本表。未実施項目を PASS と書いていない | |
| AC29 | 必須 | PASS（現在の候補 + 履歴 `092cd77`） | clean environment | 2026-10-01、公開 repo https://github.com/10001000hub/beacon-workshop.git を新規 scratch ディレクトリへ `git clone`、`feat/working-mvp` の `092cd77` をチェックアウト。既存の node_modules・dist・Playwright 設定は持ち込まず、`npm ci`（0 vulnerabilities）→ `npx playwright install chromium` → `npm run check`（typecheck → 143 unit tests → validate:content「6 quests, 18 activities」→ build → Chromium E2E 34 passed）が exit 0 | 制限: Playwright のブラウザキャッシュ（`~/.cache/ms-playwright`）はローカルと共用（`install chromium` は既存キャッシュを再利用）。同じマシン・同じ OS であり、別マシン・Windows での再現ではない。上記は旧コード（`092cd77`）の履歴で、現在の候補の証拠ではない。**現在の候補**: ブランチは公開 repo のベース `354d937` の新規・隔離 GitHub clone から作り、node_modules・dist・設定は持ち込まず新規 `npm ci` を行った。そのコードで typecheck → 146 unit/content tests → validate:content（6 quests, 18 activities）→ build → Chromium E2E 34 の全段階が実際の終了コード 0（2026-10-01 08:16:44 UTC、肖像の小修正より前）、修正後は ui/a11y 16 件を単独実行して成功。同じマシン・同じ WSL OS・共用 Playwright ブラウザキャッシュという制限あり（別マシン・Windows ではない）。修正後のフル再実行は行っていない |
| AC30 | 公開前 | PASS（現在の候補。下記の限界あり） | 差分 / grep | **現在の候補（コミット前、ルート実施）**: 追跡予定・未追跡の意図したテキスト 144 件（UTF-8）と生成 WebP 17 件・自動撮影 PNG 8 件（バイナリ）を走査し、個人のローカルパス、セッション ID、資格情報パターン、個人メール・パスワード・トークン代入パターンはなし。`src` にネットワーク API なし。正本仕様・`src/core`・CI workflow は変更なし。アートはオリジナルの SVG/WebP（`art/README.md` 記載）。レビュー用に実画面の PNG 8 枚を `docs/screenshots/` に同梱（画像チャンクのみ、EXIF 等のメタデータなし。自動化した模擬演習で、実 Codex・ユーザー記録ではない）。ログ・セッションデータ・学習者の保存データは追跡しない。`git diff --check` は終了コード 0。限界: パターン走査であり、セキュリティの保証ではない。**履歴（旧ツリー）**: `db85a3d` 以降の追跡ファイル108件を走査: API キー・トークン・秘密鍵・パスワード代入、個人メール、ローカル絶対パスのパターンなし。当時は画像・ログ・スクリーンショットは追跡されておらず `public/assets` は仮 SVG 20件だった。現在の候補は WebP/SVG のアート 20 点と `art/source` を含むため、この旧記述は当てはまらない。`src` に fetch / XHR / sendBeacon / WebSocket / password 入力 / `localStorage.clear()` / innerHTML の使用なし（コメントでの言及のみ） | 現在の候補は上記、旧ツリーは履歴 |

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
- 未確認のまま（HUMAN_ONLY）: iPhone Safari 実機 / Windows 実 Codex / スクリーンリーダー / 200% 拡大 / 母語話者の英語校閲。最終アートは AC27 参照（候補 20 点を作成済み、オーナー目視は HUMAN_ONLY）

## RC 作業で追加した確認（`a8dd34b`、`662c482`）
- アクセシビリティ（自動）: `a11y.spec.ts`（axe-core 4.13.0 を node_modules から注入）。修正した違反: region、color-contrast、heading-order、landmark-unique（`--control-line` 追加、`.pin.locked` 色、バナーに `role=region` と `aria-label`）。ja / en 各 1 本 + 結果・復旧画面
- AC18: 英語教材（クエスト 6、実習、用語、物語、出典、経路）と網羅テスト
- AC22: Q04 壊れた練習用見本と検査（上表）
- WebKit: CI PASS（上記）、ローカルは EXTERNAL_TOOL_ONLY。未実施のまま（HUMAN_ONLY）: 実機 iPhone Safari、Windows 実 Codex での実習 6 件（AC20/AC21）、VoiceOver/NVDA、人手の 200% 拡大、母語話者による英語校閲、最終アート（AC27）
