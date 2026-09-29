// 壊れた練習用見本（Q04）— わざと不具合を入れています。
// 不具合: 題名が「空文字」のときだけ拒否し、半角・全角の空白だけの題名は登録してしまう。
export const STORAGE_KEY = 'beacon-notes-q04-broken-sample.v1';

export function validateTitle(title) {
  if (title === '') return { ok: false, reason: '題名を入力してください' };
  return { ok: true };
}

export function addNote(notes, title, body) {
  const v = validateTitle(title);
  if (!v.ok) return { ok: false, reason: v.reason, notes };
  return { ok: true, notes: [...notes, { title, body }] };
}
