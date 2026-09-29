import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = resolve(process.cwd(), 'public/practice/q04-broken-sample');
const run = (cwd: string) => spawnSync(process.execPath, ['check.mjs'], { cwd, encoding: 'utf8' });

describe('Q04 broken practice sample (AC22)', () => {
  it('reproduces the bug: whitespace-only titles are accepted, empty is rejected', () => {
    const r = run(DIR);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('OK  空文字の題名は拒否される');
    expect(r.stdout).toContain('NG  半角空白だけの題名は拒否される');
    expect(r.stdout).toContain('NG  全角空白だけの題名は拒否される');
    // Adding and keeping notes already works, so a "fix" must not be over-broad.
    expect(r.stdout).toContain('OK  通常の日本語題名は登録できる');
    expect(r.stdout).toContain('OK  拒否しても保存済みのメモは残る');
  });

  it('a minimal title-only fix passes every check (the check can be satisfied)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'q04-fixed-'));
    cpSync(DIR, dir, { recursive: true });
    const core = join(dir, 'notes-core.js');
    writeFileSync(core, readFileSync(core, 'utf8').replace("title === ''", "title.trim() === ''"));
    // trim() also strips U+3000, so full-width whitespace is covered.
    const r = run(dir);
    expect(r.stdout).not.toContain('NG');
    expect(r.status).toBe(0);
  });

  it('an over-broad fix that rejects normal titles is caught', () => {
    const dir = mkdtempSync(join(tmpdir(), 'q04-over-'));
    cpSync(DIR, dir, { recursive: true });
    const core = join(dir, 'notes-core.js');
    writeFileSync(core, readFileSync(core, 'utf8').replace("if (title === '')", 'if (true)'));
    const r = run(dir);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('NG  通常の日本語題名は登録できる');
  });

  it('is isolated: its own storage key, no network, no dynamic HTML', () => {
    const files = readdirSync(DIR).filter((f) => /\.(js|mjs|html)$/.test(f));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const text = readFileSync(join(DIR, f), 'utf8');
      expect(text, f).not.toMatch(/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|innerHTML|localStorage\.clear/);
      expect(text, f).not.toMatch(/beacon-workshop\./);
    }
    expect(readFileSync(join(DIR, 'notes-core.js'), 'utf8')).toContain('beacon-notes-q04-broken-sample.v1');
  });
});
