// 使い方: このフォルダで `node check.mjs`。修正後の notes-core.js に同じ確認をやり直す。
// 通信・ファイル書き込みはしません。すべて成功で終了コード 0、1つでも失敗で 1。
import { addNote } from './notes-core.js';

const existing = [{ title: '氷の配達', body: '朝の分' }];
const cases = [
  ['空文字の題名は拒否される', () => !addNote([], '', 'x').ok],
  ['半角空白だけの題名は拒否される', () => !addNote([], ' ', 'x').ok],
  ['全角空白だけの題名は拒否される', () => !addNote([], '　', 'x').ok],
  ['拒否のとき理由が表示できる', () => typeof addNote([], ' ', 'x').reason === 'string' && addNote([], ' ', 'x').reason.length > 0],
  ['通常の日本語題名は登録できる', () => addNote([], '氷の配達', '朝の配達').ok],
  ['拒否しても保存済みのメモは残る', () => addNote(existing, ' ', 'x').notes.some((n) => n.title === '氷の配達')],
  ['登録すると保存済みのメモも残る', () => addNote(existing, '灯りの点検', 'y').notes.length === 2],
];
let failed = 0;
for (const [name, fn] of cases) {
  let ok = false;
  try { ok = fn() === true; } catch { ok = false; }
  if (!ok) failed += 1;
  console.log(`${ok ? 'OK  ' : 'NG  '}${name}`);
}
process.exit(failed === 0 ? 0 : 1);
