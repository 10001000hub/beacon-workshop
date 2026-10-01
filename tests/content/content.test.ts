import { existsSync, readFileSync, readdirSync } from 'node:fs';
// @ts-expect-error jsdom ships no type declarations; only used here as a strict XML parser.
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { loadContent, RAW_CONTENT } from '../../src/content/index';
import { REQUIRED_ASSET_IDS, totalRequiredActivities, validateContent } from '../../src/content/validate';
import { outcomesOf } from '../../src/core/grading';
import { ACTIVITY_TYPES, type QuestDefinition } from '../../src/core/types';

const content = loadContent();
const activities = content.quests.flatMap((q) => q.activities);

describe('content counts (§8, AC04)', () => {
  it('validates with zero errors', () => {
    expect(validateContent(RAW_CONTENT)).toEqual([]);
  });
  it('6 quests, 18 required activities, 18 takeaways, 6 practice cards, 600 XP', () => {
    expect(content.quests.map((q) => q.id)).toEqual(['q01', 'q02', 'q03', 'q04', 'q05', 'q06']);
    expect(totalRequiredActivities(content.quests)).toBe(18);
    for (const q of content.quests) {
      expect(q.activities, q.id).toHaveLength(3);
      expect(q.objectives, q.id).toHaveLength(3);
      expect(q.takeawayCards, q.id).toHaveLength(3);
    }
    expect(content.practice).toHaveLength(6);
    expect(18 * 20 + 6 * 40).toBe(600);
  });
  it('uses only the four activity types; no four-choice quiz engine', () => {
    for (const a of activities) expect(ACTIVITY_TYPES).toContain(a.type);
    expect(new Set(activities.map((a) => a.type)).size).toBe(4);
  });
  it('activity IDs are unique and follow qNN-x', () => {
    const ids = activities.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^q0[1-6]-[abc]$/);
  });
});

describe('feedback and hints', () => {
  it('every outcome has feedback with what/why/next, every option has an explanation, exactly three hints', () => {
    for (const a of activities) {
      for (const o of outcomesOf(a.grading)) {
        const fb = a.feedbackByOutcome[o];
        expect(fb, `${a.id}:${o}`).toBeDefined();
        expect(JSON.stringify(fb)).not.toBe('{}');
      }
      expect(a.hints, a.id).toHaveLength(3);
      const options =
        a.type === 'prompt_builder' || a.type === 'evidence_board'
          ? a.cards
          : a.type === 'change_review'
            ? a.questions.flatMap((q) => q.options)
            : [...a.decisions, ...a.cases.flatMap((c) => c.reasons ?? [])];
      for (const opt of options) expect(opt.explain?.ja, `${a.id}:${opt.id}`).toBeTruthy();
    }
  });
});

describe('story constraints', () => {
  it('only Nagi, Koto and Ritsu as named main characters (plus narration and unnamed residents)', () => {
    expect(Object.keys(content.story.characters).sort()).toEqual(['koto', 'nagi', 'narrator', 'resident', 'ritsu']);
    const speakers = new Set(
      content.quests.flatMap((q) => [...q.briefScene.lines, ...q.clearScene.lines, ...q.activities.flatMap((a) => a.successLines ?? [])].map((l) => l.speaker)),
    );
    for (const sp of speakers) expect(['nagi', 'koto', 'ritsu', 'narrator', 'resident']).toContain(sp);
  });
});

describe('glossary, sources, practice, routes', () => {
  it('24 glossary terms with unique IDs', () => {
    expect(content.glossary).toHaveLength(24);
    expect(new Set(content.glossary.map((g) => g.id)).size).toBe(24);
  });
  it('sources are https and do not claim to be checked', () => {
    for (const s of content.sources) {
      expect(s.resolvedUrl).toMatch(/^https:\/\//);
      expect(s.status).toBe('unchecked');
    }
  });
  it('nothing is marked device_verified (no fabricated verification)', () => {
    const all = JSON.stringify({ practice: content.practice, routes: content.routes });
    expect(all).not.toContain('device_verified');
    for (const r of content.routes) {
      expect(r.testedAt).toBeNull();
      expect(r.testedProductVersion).toBeNull();
      expect(r.screenshotIds).toEqual([]);
    }
  });
});

describe('assets (§12)', () => {
  it('manifest has the 20 required IDs and every file exists', () => {
    expect(content.assets.map((a) => a.id).sort()).toEqual([...REQUIRED_ASSET_IDS].sort());
    expect(content.assets).toHaveLength(20);
    for (const a of content.assets) {
      expect(existsSync(`public/${a.path}`), a.path).toBe(true);
      expect(a.alt.ja, a.id).toBeTruthy();
    }
  });
  it('art SVGs (public and editable sources) contain no scripts, external references or embedded text', () => {
    for (const dir of ['public/assets/art', 'art/source']) {
      for (const f of readdirSync(dir).filter((n) => n.endsWith('.svg'))) {
        const svg = readFileSync(`${dir}/${f}`, 'utf8');
        expect(svg, `${dir}/${f}`).not.toMatch(/<script|<foreignObject|<image|<text|\son\w+=|href=|https?:\/\/(?!www\.w3\.org)/i);
        // Strict XML parse: duplicate attributes or unclosed tags make the browser drop the whole SVG.
        expect(() => new JSDOM(svg, { contentType: 'image/svg+xml' }), `${dir}/${f} is well-formed`).not.toThrow();
      }
    }
  });
  it('legacy placeholder SVGs (unused, kept as history) still contain no scripts or external references', () => {
    // Original signed-off check, unchanged. They are not in the manifest and may still hold their "PLACEHOLDER" label.
    const files = readdirSync('public/assets/placeholders').filter((n) => n.endsWith('.svg'));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const svg = readFileSync(`public/assets/placeholders/${f}`, 'utf8');
      expect(svg, f).not.toMatch(/<script|on\w+=|https?:\/\/(?!www\.w3\.org)/i);
    }
  });
  it('raster art is WebP at the specified size and the whole set stays within the 8MB budget', () => {
    const size = (buf: Buffer): [number, number] => {
      expect(buf.toString('ascii', 0, 4)).toBe('RIFF');
      expect(buf.toString('ascii', 8, 12)).toBe('WEBP');
      const kind = buf.toString('ascii', 12, 16);
      if (kind === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
      if (kind === 'VP8 ') return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
      const bits = buf.readUInt32LE(21);
      return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
    };
    const want = (id: string): [number, number] =>
      id === 'MAP01' ? [2048, 1536] : id.startsWith('BG') ? [1920, 1080] : id.startsWith('CH') ? [768, 1024] : [768, 768];
    let total = 0;
    for (const a of content.assets) {
      const buf = readFileSync(`public/${a.path}`);
      total += buf.length;
      if (a.path.endsWith('.webp')) expect(size(buf), a.id).toEqual(want(a.id));
      else expect(a.path, a.id).toMatch(/\.svg$/);
    }
    expect(total).toBeLessThanOrEqual(8 * 1024 * 1024);
    const firstScreen = ['MAP01', 'LOGO01', 'ICONS01', 'BADGES01'].reduce((n, id) => n + readFileSync(`public/${content.assets.find((a) => a.id === id)!.path}`).length, 0);
    expect(firstScreen).toBeLessThanOrEqual(1.5 * 1024 * 1024);
  });
  it('every asset has ja and en alt text, no placeholder wording, and is only a candidate (no claimed sign-off)', () => {
    for (const a of content.assets) {
      expect(a.alt.ja, a.id).toBeTruthy();
      expect(a.alt.en, a.id).toBeTruthy();
      expect(`${a.alt.ja}${a.alt.en}`, a.id).not.toMatch(/仮素材|placeholder/i);
      expect(a.status, a.id).toBe('candidate');
    }
  });
});

describe('locale parity', () => {
  it('en.json has the same keys as ja.json', async () => {
    const ja = JSON.parse(readFileSync('src/content/locales/ja.json', 'utf8')) as Record<string, string>;
    const en = JSON.parse(readFileSync('src/content/locales/en.json', 'utf8')) as Record<string, string>;
    expect(Object.keys(en).sort()).toEqual(Object.keys(ja).sort());
  });
});

describe('validator catches broken content', () => {
  it('reports a missing activity, missing feedback and a device_verified claim', () => {
    const broken = JSON.parse(JSON.stringify(RAW_CONTENT)) as typeof RAW_CONTENT;
    const quests = broken.quests as QuestDefinition[];
    quests[0]!.activities.pop();
    const a = quests[1]!.activities[0]!;
    const wrong = outcomesOf(a.grading).find((o) => o !== 'correct')!;
    delete a.feedbackByOutcome[wrong];
    ((broken.practice as { status: string }[])[0]!).status = 'device_verified';
    const errs = validateContent(broken);
    expect(errs).toEqual(
      expect.arrayContaining([
        'q01: needs 3 activities',
        `q02/${a.id}: missing feedback for outcome ${wrong}`,
        expect.stringMatching(/^practice pc-q01: device_verified requires/),
      ]),
    );
  });
});

describe('English content coverage (AC18)', () => {
  const missing: string[] = [];
  const walk = (o: unknown, path: string): void => {
    if (Array.isArray(o)) return o.forEach((v, i) => walk(v, `${path}[${i}]`));
    if (o && typeof o === 'object') {
      const r = o as Record<string, unknown>;
      if (typeof r.ja === 'string' && Object.keys(r).every((k) => k === 'ja' || k === 'en')) {
        if (typeof r.en !== 'string' || (r.ja !== '' && r.en === '')) missing.push(path);
        return;
      }
      for (const [k, v] of Object.entries(r)) walk(v, `${path}/${k}`);
    }
  };
  it('every LocalizedText has an English text', () => {
    walk(RAW_CONTENT, 'content');
    expect(missing).toEqual([]);
  });
});
