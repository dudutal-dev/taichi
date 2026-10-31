import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSession } from './plan';
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
  it('מסלול ישיבה: שמונה המקטעים, בלי חימום עמידה', () => {
    const s = buildSession(manifest, 3, { track: 'seated' });
    expect(s.items.filter(i => i.phase === 'warmup')).toHaveLength(0);
    expect(new Set(s.items.filter(i => i.phase === 'core').map(i => i.movementId)).size).toBe(8);
  });
});
