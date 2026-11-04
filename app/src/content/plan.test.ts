import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSession, tcaReady, WEEKS_JOINTS, TCA_MOVEMENTS } from './plan';
import type { Manifest } from './manifest';

const manifest = JSON.parse(readFileSync(resolve(__dirname, '../../../content/manifest.json'), 'utf8')) as Manifest;

describe('בונה המפגש', () => {
  const { items } = buildSession(manifest, 1);
  it('מתחיל בפתיח ומסתיים בשלוש נשימות', () => {
    expect(items[0]?.key).toBe('open');
    expect(items[items.length - 1]?.key).toBe('close-words');
  });
  it('"החימום הסתיים" מתנגן בסוף הקטע האחרון של החימום, לא בתחילתו (באג 31.10)', () => {
    const warm = items.filter(i => i.phase === 'warmup');
    const last = warm[warm.length - 1]!;
    expect(last.narrationEnd).toContain('warm_done');
    expect(last.narration).not.toContain('warm_done');
    for (const w of warm.slice(0, -1)) expect(w.narrationEnd).not.toContain('warm_done');
  });
  it('החימום לא ניתן לדילוג בשבועות 1–4', () => {
    expect(items.filter(i => i.phase === 'warmup').every(i => !i.skippable)).toBe(true);
  });
  it('רשת ביטחון של 10 דקות: פחות חזרות, עדיין עם חימום וסיום', () => {
    const short = buildSession(manifest, 1, { short: true });
    expect(short.plannedMin).toBe(10);
    expect(short.items.some(i => i.phase === 'warmup')).toBe(true);
    expect(short.items.some(i => i.phase === 'close')).toBe(true);
    const together = short.items.find(i => i.mode === 'together' && i.phase === 'core');
    expect(together?.loops).toBe(2);
  });
  it('כל קריינות שמוזכרת קיימת במניפסט', () => {
    const missing = items.flatMap(i => [...i.narration, ...i.narrationEnd]).filter(id => !manifest.narration[id]);
    expect(missing).toEqual([]);
  });
  it('בכל 14 השבועות ובמסלול הישיבה — כל הקריינות קיימת', () => {
    for (let w = 1; w <= 14; w++) {
      for (const opts of [{ firstOfWeek: true }, { short: true }, { track: 'seated' as const, firstOfWeek: true }]) {
        const s = buildSession(manifest, w, opts);
        const missing = s.items.flatMap(i => [...i.narration, ...i.narrationEnd]).filter(id => !manifest.narration[id]);
        expect(missing, `שבוע ${w} ${JSON.stringify(opts)}`).toEqual([]);
      }
    }
  });
  it('שבוע 7 מכניס בעיטת עקב; סחרחורת מדלגת על תנועות שיווי משקל', () => {
    const w7 = buildSession(manifest, 7, {});
    expect(w7.items.some(i => i.movementId === 'heel_kick')).toBe(true);
    const nobal = buildSession(manifest, 7, { skipBalance: true });
    expect(nobal.items.some(i => i.movementId === 'heel_kick' || i.movementId === 'golden_rooster')).toBe(false);
  });
  it('קליף חזיתי שנדחה ב-QA: הצד הופך לזווית הראשית, ובלי שום קליף — סטיל + קריינות (4ב)', () => {
    const w7 = buildSession(manifest, 7, {});
    const roosterL = w7.items.find(i => i.key === 'golden_rooster-0-demo')!;
    expect(roosterL.frontUrl).toContain('golden_rooster_side');
    expect(roosterL.sideAvailable).toBe(false);
    expect(w7.items.find(i => i.key === 'golden_rooster-1-still')?.stillUrl).toContain('golden_rooster_right_front');
    expect(w7.items.find(i => i.key === 'heel_kick-0-demo')?.frontUrl).toContain('heel_kick_side');
    const seated = buildSession(manifest, 3, { track: 'seated' });
    expect(seated.items.filter(i => i.phase === 'core').every(i => i.loops === 0 && i.stillUrl.startsWith('stills/'))).toBe(true);
  });
  it('מסלול ישיבה: שמונה המקטעים, בלי חימום עמידה', () => {
    const s = buildSession(manifest, 3, { track: 'seated' });
    expect(s.items.filter(i => i.phase === 'warmup')).toHaveLength(0);
    expect(new Set(s.items.filter(i => i.phase === 'core').map(i => i.movementId)).size).toBe(8);
  });
});

describe('מסלול מפרקים (TCA, אושר 31.10)', () => {
  it('בלי תוכן TCA במניפסט: המסלול הראשי בלי תנועות בעומס ברך גבוה', () => {
    expect(tcaReady(manifest)).toBe(false);
    const j = buildSession(manifest, 6, { track: 'joints' });
    expect(j.items.some(i => i.movementId === 'wild_horse' || i.movementId === 'repulse_monkey')).toBe(false);
    expect(j.items.some(i => i.movementId === 'cloud_hands')).toBe(true);
    const missing = j.items.flatMap(i => [...i.narration, ...i.narrationEnd]).filter(id => !manifest.narration[id]);
    expect(missing).toEqual([]);
  });
  it('תוכנית 12 השבועות של TCA: כל ההנחיות שהיא מזכירה מוגדרות בתסריט tca.md', () => {
    const script = readFileSync(resolve(__dirname, '../../../content/scripts/he/tca.md'), 'utf8');
    const ids = new Set([...script.matchAll(/^id: (\S+) \|/gm)].map(m => m[1]));
    const ref = new Set<string>();
    for (const w of WEEKS_JOINTS) { ref.add(`session_open_j${w.week}`); for (const d of w.core) { if (d.intro) ref.add(d.intro); if (d.outro) ref.add(d.outro); for (const u of d.units) { u.cues.forEach(c => ref.add(c)); if (u.sideCue) ref.add(u.sideCue); } } }
    ref.add('tca_form_intro');
    expect([...ref].filter(id => !ids.has(id))).toEqual([]);
    expect(WEEKS_JOINTS).toHaveLength(12);
    expect(new Set(WEEKS_JOINTS[11]!.core.map(d => d.id)).size).toBe(11); // 12 תנועות, פתיחה-וסגירה פעמיים
  });
  it('כל תמונת-מפתח של TCA ב-plan.ts מוגדרת בצנרת (keyframes_tca + clips_tca)', async () => {
    const kf = readFileSync(resolve(__dirname, '../../../pipeline/keyframes_tca.mjs'), 'utf8');
    const cl = readFileSync(resolve(__dirname, '../../../pipeline/clips_tca.mjs'), 'utf8');
    const used = TCA_MOVEMENTS.flatMap(d => d.units.flatMap(u => [u.front, u.side].filter(Boolean) as string[]));
    expect(used.filter(id => !kf.includes(`${id}:`) || !cl.includes(`${id}:`))).toEqual([]);
  });
});

describe('מבט צד', () => {
  it('לפריט "מבט צד" יש קליף צד, והקריינות שלו היא הנחיית הצד', () => {
    const { items } = buildSession(manifest, 1);
    const side = items.filter(i => i.mode === 'side');
    expect(side.length).toBeGreaterThan(0);
    for (const s of side) { expect(s.sideUrl).toBeTruthy(); expect(s.sideAvailable).toBe(true); }
  });
});
