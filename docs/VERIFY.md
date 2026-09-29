# VERIFY — Working MVP 検証報告

- 対象: ブランチ `feat/working-mvp`、コード最終コミット `662c482`（この SHA に対して下記を実行。その上に docs のみのコミットが載る）。リポジトリは公開済み（https://github.com/10001000hub/beacon-workshop ）だが、**アプリはデプロイしていない**
- CI: **`662c482` 以降の run は未観測（未 push のため NOT RUN）**。過去の run（36576369888 = `e82d2bb`、36584150452 = `f7f14bf`）は、それより前のコミットの証拠であり、現在の HEAD の証拠として使わない。WebKit の CI ジョブ（`ci.yml` の `webkit`）は追加済みだが一度も実行していない
- 実行日: 2026-09-30 / 環境: WSL2 Linux, Node 22.23.1, npm 10.9.8, Playwright 1.61.0 Chromium（WebKit ブラウザは取得できたが、この環境に必要な OS ライブラリがなく sudo も使えないため起動できない）
- 実行結果（`662c482` の作業ツリーで `npm run check`、終了コード 0）: typecheck 成功 / `npm test` 8 files, 143 tests passed / `npm run validate:content` OK（6 quests, 18 activities）/ `npm run build` 成功 / `npm run test:e2e` 34 passed (chromium)
- クリーン clone での再現（AC29）は、この修正後は **NOT RUN**
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
| AC10 | 必須 | PASS | Unit / E2E | `storage.test.ts`: 破損・未対応版の値は通常の書き込みでバイト単位で不変、Session が blocked になり復旧は明示操作のまま。`prerc.spec.ts` B1（別タブが schemaVersion 2 / 破損 JSON を書く → 元タブで操作・課題完了しても保存値は不変、blocked-banner と復旧リンク）。`save.spec.ts`: 復旧画面・バックアップ復元 | 旧 MVP ではこの経路が上書きされ得た（レビュー B1）。修正後に新しい証拠で PASS。制限: リセット／インポート前の保護（I1）はメモリ上の保持なので、再読み込み後の最初の通常書き込みでバックアップが更新される。エクスポートが第一の保険 |
| AC11 | 必須 | PASS | Unit / E2E | `storage.test.ts`: 書き込むのは2キーのみ、ソース中に `storage.clear(` 呼び出しがない。`save.spec.ts`: 他キーが不変 | |
| AC12 | 必須 | PASS | Unit / E2E | `storage.test.ts`: 往復、許可リスト外・`__proto__` 除去、64 KiB 超・新版・不正 JSON を拒否。`save.spec.ts` export/import | |
| AC13 | 必須 | PASS | E2E / Unit | `save.spec.ts` "two tabs…": 課題完了 → 古いタブが conflict-banner、書き込み停止、再読み込み。`prerc.spec.ts` I8: 画面遷移だけでは他タブに conflict は出ず、実際の進捗でのみ conflict | 遷移では revision を上げない（保存位置は次の実質的な保存時に反映） |
| AC14 | 必須 | PASS | E2E / 文言確認 | 地図・ノート・終幕で疑似演習/読了/実習を別表示（`ui.spec.ts` reading mode: sim 0/18, read 1/6）。実習は「下書き」表示 | |
| AC15 | 必須 | PASS | 表示テスト (Chromium のみ。WebKit は NOT RUN) | `ui.spec.ts`: 320/390/768/1440px で横スクロールなし（12画面 + 読む版）。320/390px で代表画面（クエスト概要・課題・地図・設定）の主要操作（開始リンク、送信、ヒント、カード、リセット、エクスポート）が存在し、スクロールで到達でき、幅内に収まり、他要素に覆われない（`elementFromPoint`）。320/390px で課題を実際に完了 | WebKit・実機での表示は NOT RUN（§17.3、RC 前に必要） |
| AC16 | 必須 | PASS | E2E（キーボードのみ） | `keyboard.spec.ts`: 18課題すべてを Tab/Enter/Space/矢印キーだけで完了（実際の Tab 移動で到達、`.click()`/`.check()` は不使用）。4種（prompt_builder / evidence_board / change_review / triage_decision）すべてを通過し 18/18 を確認。`ui.spec.ts`: `draggable` なし | Chromium のみ。スクリーンリーダーは AC17（NOT RUN） |
| AC17 | 必須 | NOT RUN | 自動 + 手動 | 自動で確認済み: axe-core（`a11y.spec.ts`、ja/en の代表画面と結果・復旧画面で違反 0。同梱の axe-core を注入し、ネットワーク不使用）、 画面遷移で h1 にフォーカス、skip link と可視フォーカス、結果の `aria-live` 領域に文言が入る、文字サイズ 1.3、動き低減の保存 | スクリーンリーダー（VoiceOver/NVDA）とブラウザ 200% 拡大の手動確認は未実施 |
| AC18 | RC 条件 | PASS（機械検査の範囲） | 教材チェック | 全 `LocalizedText`（6 クエスト、実習、用語、物語、出典、経路）に英語がある（`content.test.ts` "English content coverage"）。UI キー・プレースホルダも全件一致（`i18n.test.ts`）。英語 UI で採点が同じことも確認済み | 英訳は作成者による初訳で、母語話者の校閲は受けていない（NOT RUN）。残った日本語断片は `lang="ja"` で示される |
| AC19 | 必須 | PASS | Unit / E2E | `i18n.test.ts`: 言語に依存せず採点が同じ。`ui.spec.ts`: 英語切替で進捗不変 | |
| AC20 | 必須（内容）/ 実機は RC | DEFERRED TO RELEASE CANDIDATE | 教材チェック / 実機 | `content.test.ts` + `validate.ts`: 6枚すべてに whereToAct・successExample・failureRecovery がある | 内容チェックは PASS。実機で手順が通ることは未確認のため全体は RC |
| AC21 | RC 条件 | DEFERRED TO RELEASE CANDIDATE | 実機確認 | 経路の testedAt / testedProductVersion は null、スクリーンショットなし（テストで確認） | 捏造しないことを優先。実機検証は RC |
| AC22 | 必須（仕様上 Device / sample） | PASS（見本の範囲）/ 実際の Codex での実習は NOT RUN | 見本テスト | `public/practice/q04-broken-sample/`（別の保存キー `beacon-notes-q04-broken-sample.v1`、`check.mjs` 7 ケース）。`fixture.test.ts` で不具合の再現・修正後の合格・通常題名の維持・保存キーの隔離を確認、`rc.spec.ts` でブラウザ上の再現を確認 | 見本は自動テストで検証済み。実際の Codex でこの見本を使った実習は未検証（実習カードは `draft` のまま） |
| AC23 | 必須 | PASS | 表示 / 文言 | `ui.spec.ts` "simulation banner is on every screen"、実習は「下書き」、`device_verified` が存在しない（`content.test.ts`） | |
| AC24 | 必須 | PASS | セキュリティテスト | `save.spec.ts`: HTML を含むノートを import しても実行・要素化されない（`__pwned` なし、img なし）。描画は textContent のみ、CSP meta | |
| AC25 | 必須 | PASS | ネットワーク / コード | E2E の外部リクエスト 0 件。`src` に fetch / XMLHttpRequest / sendBeacon / WebSocket / password 入力なし（grep） | |
| AC26 | 必須 | PASS | CI 設定 / 実行 | `.github/workflows/ci.yml`（npm ci → Chromium → typecheck/test/validate/build/e2e、失敗時のみトレース保存、AI・有料 API・secret なし）。GitHub Actions run 36498603515 が commit `c4d44a9` で success（MVP 時点。`aebbef8` の CI は未観測） | 初回 run 36498169680 は skip link の遷移待ち不足で e2e 1件 FAIL → テストを修正して解消 |
| AC27 | RC 条件（最終素材） | DEFERRED（画像制作手段なし。第三者・stock 素材は使わない） | 台帳 / 表示 | `asset-manifest.json` に20件（MAP01, BG01–06, CH01–09, FX01, LOGO01, ICONS01, BADGES01）、全ファイル存在、alt あり、`status: placeholder`、SVG にスクリプト・外部参照なし | 台帳と代替表示は MVP で確認済み。最終アートと使用条件は RC |
| AC28 | 必須 | PASS | 報告照合 | 本表。NOT RUN / DEFERRED を PASS と書いていない | |
| AC29 | 必須 | NOT RUN | clean environment | MVP 時点（`c4d44a9`）では clone → `npm ci` → 全コマンド成功。pre-RC 修正後（`aebbef8`）のクリーン clone 再現は未実施 | 別マシン・Windows ではない。ブラウザキャッシュは共用 |
| AC30 | 公開前 | PASS | 差分 / grep | 追跡ファイル87件に API キー・パスワード・秘密鍵・個人メール・ローカル絶対パスのパターンなし。学習ログ・スクリーンショットなし | 公開済み。MVP 時点の確認で、今回の修正後は再走査していない（NOT RUN） |

## 未実施のブラウザ確認（§17.3）
- Playwright WebKit: プロジェクト（`PW_WEBKIT=1`）と CI ジョブは用意したが、ローカルでは OS ライブラリ不足で起動できず **NOT RUN**。CI での実行は push 後（要オーナー承認）
- 実機 iPhone Safari: NOT RUN（公開前に必須）
- Windows 上の実習経路: NOT RUN（RC）

## pre-RC 修正で追加した確認（`aebbef8`）
- B1 / I1 / I8: `storage.test.ts`、`prerc.spec.ts`（別タブ書き込み、リセット後のバックアップ保持と復元、遷移だけでは conflict なし）
- I2 / I4: `grading.test.ts`（Q06-A の 4^4 × 3^4 全数探索で正解は1通り、理由違いの個別フィードバック、Q05-A の不十分な v0.4 記録）
- I3: `state.test.ts`（レベル3ヒント後も XP は通常、再回答で二重付与なし、maxHintLevel 保持）、`prerc.spec.ts`（「解答例を見て完了」表示）
- I5: `prerc.spec.ts`（リセット確認は Cancel にフォーカス、キャンセルでトリガーに戻る）
- I6: `langMark.test.ts`、`prerc.spec.ts`（英語 UI で日本語本文に `lang="ja"`、英語 UI の文字は対象外）。制限: `aria-label` などの属性と `document.title` には言語を付けられない
- 未確認のまま: WebKit / iPhone Safari / Windows Codex / スクリーンリーダー / 実機（すべて NOT RUN）

## RC 作業で追加した確認（`a8dd34b`、`662c482`）
- アクセシビリティ（自動）: `a11y.spec.ts`（axe-core 4.13.0 を node_modules から注入）。修正した違反: region、color-contrast、heading-order、landmark-unique（`--control-line` 追加、`.pin.locked` 色、バナーに `role=region` と `aria-label`）。ja / en 各 1 本 + 結果・復旧画面
- AC18: 英語教材（クエスト 6、実習、用語、物語、出典、経路）と網羅テスト
- AC22: Q04 壊れた練習用見本と検査（上表）
- 未実施のまま（すべて NOT RUN / DEFERRED）: WebKit（ローカル・CI とも）、実機 iPhone Safari、Windows 実 Codex での実習 6 件（AC20/AC21）、VoiceOver/NVDA、人手の 200% 拡大、母語話者による英語校閲、最終アート（AC27）
