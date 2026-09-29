import { STORAGE_KEY, addNote } from './notes-core.js';

const list = document.getElementById('list');
const msg = document.getElementById('msg');
let notes = [];
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  notes = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(notes)) notes = [];
} catch {
  notes = [];
}

function render() {
  list.replaceChildren(
    ...notes.map((n) => {
      const li = document.createElement('li');
      const b = document.createElement('strong');
      b.textContent = n.title === '' ? '（題名なし）' : n.title;
      const p = document.createElement('span');
      p.textContent = ` — ${n.body}`;
      li.append(b, p);
      return li;
    }),
  );
}

document.getElementById('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const body = document.getElementById('body').value;
  const r = addNote(notes, title, body);
  msg.textContent = r.ok ? '' : r.reason;
  if (r.ok) {
    notes = r.notes;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      msg.textContent = 'この端末には保存できませんでした（画面を閉じると消えます）';
    }
    e.target.reset();
  }
  render();
});
render();
