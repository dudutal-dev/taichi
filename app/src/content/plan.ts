// תוכנית 12 השבועות (שבועות 1–4 ממומשים; 5+ יתווספו עם התוכן של שלב 4ב) ובונה הפלייליסט למפגש.
// מבנה מפגש (סעיף 5): פתיח → חימום (לא ניתן לדלג 1–4) → ליבה (הדגמה → ביצוע משותף ×4–8 → מבט צד) → סיום → שאלת בטיחות.
import { approvedClip, movementOf, type Manifest } from './manifest';

/** יחידת תנועה = תמונת-מפתח אחת: קליף חזיתי, קליף צד (אופציונלי), קריינות. */
export interface Unit {
  front?: string;            // מזהה קליף חזיתי
  side?: string;             // מזהה קליף צד
  cues: string[];            // קריינות ההנחיה (מתנגנת בהדגמה)
  sideCue?: string;          // קריינות למבט הצד
  label: string;             // כתובית קצרה
}
export interface MovementDef { id: string; units: Unit[]; intro?: string; outro?: string }

const OPENING: MovementDef = {
  id: 'opening', intro: 'opening_intro',
  units: [
    // הידיים הצפות: מבט חזיתי נדחה ב-QA → מבט הצד הוא הזווית הראשית (הכרעת 31.10)
    { side: 'weight_shift_side_arms', front: undefined, cues: ['opening_arms'], label: 'הידיים צפות' },
    { front: 'weight_shift_front_right', cues: ['weight_shift_cue2'], label: 'משקל לרגל ימין' },
    { front: 'weight_shift_front_left', cues: ['opening_left'], label: 'משקל לרגל שמאל' },
  ],
};
const CLOUD_HANDS: MovementDef = {
  id: 'cloud_hands', intro: 'cloud_hands_intro',
  units: [
    { front: 'cloud_hands_front', side: 'cloud_hands_side', cues: ['cloud_hands_cue1'], sideCue: 'cloud_hands_side', label: 'צד ימין' },
    { front: 'cloud_hands_left_front', side: 'cloud_hands_left_side', cues: ['cloud_hands_left'], label: 'צד שמאל' },
  ],
  outro: 'cloud_hands_breath',
};
const GRASP: MovementDef = {
  id: 'grasp_bird_tail', intro: 'grasp_bird_tail_intro',
  units: [
    { front: 'grasp_bird_tail_front', side: 'grasp_bird_tail_side', cues: ['grasp_bird_tail_cue1', 'grasp_bird_tail_cue2'], sideCue: 'grasp_bird_tail_side', label: 'הדיפה' },
    { front: 'grasp_bird_tail_rollback_front', side: 'grasp_bird_tail_rollback_side', cues: ['grasp_bird_tail_rollback'], label: 'משיכה' },
    { front: 'grasp_bird_tail_press_front', side: 'grasp_bird_tail_press_side', cues: ['grasp_bird_tail_press'], label: 'לחיצה' },
    { front: 'grasp_bird_tail_push_front', side: 'grasp_bird_tail_push_side', cues: ['grasp_bird_tail_push'], label: 'דחיפה' },
  ],
};
const CROSS: MovementDef = { id: 'cross_hands', intro: 'cross_hands_intro', units: [{ front: 'cross_hands_front', side: 'cross_hands_side', cues: ['cross_hands_cue'], label: 'ידיים צולבות' }] };
const BRUSH: MovementDef = {
  id: 'brush_knee', intro: 'brush_knee_intro',
  units: [
    { front: 'brush_knee_left_front', side: 'brush_knee_left_side', cues: ['brush_knee_left'], sideCue: 'brush_knee_side', label: 'צד שמאל' },
    { front: 'brush_knee_right_front', side: 'brush_knee_right_side', cues: ['brush_knee_right'], label: 'צד ימין' },
  ],
};
const CLOSING: MovementDef = { id: 'closing', intro: 'closing_intro', units: [{ front: 'closing_front', side: 'closing_side', cues: [], label: 'סיום' }], outro: 'closing_breath' };
const WARMUP: MovementDef = {
  id: 'warmup', intro: 'warm_intro', outro: 'warm_done',
  units: [
    { front: 'warm_ankle_front', cues: ['warm_ankle'], label: 'קרסוליים' },
    { side: 'warm_knee_side', cues: ['warm_knee'], label: 'ברכיים' },       // הקליף נדחה → סטיל + קריינות
    { front: 'warm_waist_front', cues: ['warm_waist'], label: 'גו' },
    { front: 'warm_shoulder_front', cues: ['warm_shoulder'], label: 'כתפיים' },
  ],
};

export interface WeekPlan { week: number; stage: string; core: MovementDef[]; plannedMin: number; reps: number; warmupSkippable: boolean; evidence: string; newMovements: string[] }

export const WEEKS: WeekPlan[] = [
  { week: 1, stage: 'יסודות', core: [OPENING, CLOUD_HANDS], plannedMin: 12, reps: 4, warmupSkippable: false, evidence: 'שבוע 1: הגוף לומד איפה הוא במרחב. עדיין אין מה למדוד.', newMovements: ['עמידת פתיחה', 'ידיים כעננים'] },
  { week: 2, stage: 'יסודות', core: [OPENING, CLOUD_HANDS, GRASP, CROSS], plannedMin: 15, reps: 4, warmupSkippable: false, evidence: 'שבוע 2: התנועות עדיין מגושמות, וזה כמו שצריך.', newMovements: ['אחיזת זנב הציפור', 'ידיים צולבות'] },
  { week: 3, stage: 'צורת 8', core: [OPENING, CLOUD_HANDS, GRASP, CROSS, BRUSH], plannedMin: 20, reps: 5, warmupSkippable: false, evidence: 'שבוע 3: רצף ראשון. הנשימה מתחילה להוביל.', newMovements: ['ליטוף הברך וצעד', 'רצף ראשון'] },
  { week: 4, stage: 'צורת 8', core: [OPENING, CLOUD_HANDS, GRASP, CROSS, BRUSH], plannedMin: 20, reps: 6, warmupSkippable: false, evidence: 'שבוע 4: יסודות צורת 8 הושלמו. בשבוע 6 מודדים.', newMovements: ['תרנגול הזהב (בייצור)'] },
];

export function weekPlan(week: number): WeekPlan {
  return WEEKS[Math.min(WEEKS.length, Math.max(1, week)) - 1]!;
}

/** פריט בפלייליסט: קליף אחד (או סטיל) עם מספר לולאות וקריינות שמתנגנת במקביל. */
export interface PlaylistItem {
  key: string;
  movementId: string;
  title: string;           // שם התנועה
  caption: string;         // כתובית קצרה
  phase: 'open' | 'warmup' | 'core' | 'close';
  mode: 'demo' | 'together' | 'side';
  frontUrl?: string; sideUrl?: string; stillUrl: string;
  loops: number;           // כמה פעמים הלולאה בת 8 ש' מתנגנת
  narration: string[];     // מזהי קריינות
  sideAvailable: boolean;
  skippable: boolean;
}

export function buildSession(m: Manifest, week: number, opts: { short?: boolean } = {}): { items: PlaylistItem[]; plannedMin: number; plan: WeekPlan } {
  const plan = weekPlan(week);
  const items: PlaylistItem[] = [];
  const still = m.character.front.replace(/^content\//, '');
  const url = (id?: string) => (id ? approvedClip(m, id)?.url : undefined);
  const nameOf = (id: string) => movementOf(m, id)?.nameHe ?? id;
  const reps = opts.short ? 2 : plan.reps;

  items.push({ key: 'open', movementId: 'opening', title: 'פתיח', caption: `שבוע ${week}`, phase: 'open', mode: 'demo', stillUrl: still, loops: 0, narration: ['session_open', `session_open_w${Math.min(4, week)}`, 'safety_reminder'], sideAvailable: false, skippable: false });

  const pushMovement = (def: MovementDef, phase: PlaylistItem['phase'], repsHere: number) => {
    def.units.forEach((u, i) => {
      const f = url(u.front), s = url(u.side);
      const primaryIsSide = !f && !!s;
      const base = { movementId: def.id, title: nameOf(def.id), stillUrl: still, phase, sideAvailable: !!s && !!f, skippable: phase !== 'warmup' || plan.warmupSkippable };
      const cues = [...(i === 0 && def.intro ? [def.intro] : []), ...u.cues];
      if (!f && !s) { // אין קליף מאושר — סטיל + קריינות
        items.push({ ...base, key: `${def.id}-${i}-still`, caption: u.label, mode: 'demo', loops: 0, narration: cues });
        return;
      }
      const common = primaryIsSide ? { frontUrl: s, sideUrl: undefined } : { frontUrl: f, sideUrl: s };
      items.push({ ...base, ...common, key: `${def.id}-${i}-demo`, caption: `${u.label} · הדגמה`, mode: 'demo', loops: 1, narration: cues });
      if (phase === 'core') {
        items.push({ ...base, ...common, key: `${def.id}-${i}-together`, caption: `${u.label} · ביחד ×${repsHere}`, mode: 'together', loops: repsHere, narration: i === 0 ? ['breath_cue'] : [] });
        if (s && f) items.push({ ...base, ...common, key: `${def.id}-${i}-side`, caption: `${u.label} · מבט צד`, mode: 'side', loops: 1, narration: u.sideCue ? [u.sideCue] : [] });
      } else {
        items.push({ ...base, ...common, key: `${def.id}-${i}-together`, caption: `${u.label} · ביחד`, mode: 'together', loops: repsHere, narration: [] });
      }
    });
    if (def.outro) { const last = items[items.length - 1]; if (last) last.narration = [...last.narration, def.outro]; }
  };

  pushMovement(WARMUP, 'warmup', opts.short ? 1 : 2);
  for (const def of plan.core) pushMovement(def, 'core', reps);
  if (week >= 3 && !opts.short) { const last = items[items.length - 1]; if (last) last.narration.push('sequence_intro'); }
  pushMovement(CLOSING, 'close', 1);
  items.push({ key: 'close-words', movementId: 'closing', title: 'סיום', caption: 'שלוש נשימות', phase: 'close', mode: 'demo', stillUrl: still, loops: 0, narration: ['session_close'], sideAvailable: false, skippable: false });

  return { items, plannedMin: opts.short ? 10 : plan.plannedMin, plan };
}

/** אומדן משך בדקות מתוך הפלייליסט (לולאות × 8 ש' + קריינות שאינה חופפת). */
export function estimateMinutes(m: Manifest, items: PlaylistItem[]): number {
  let ms = 0;
  for (const it of items) {
    const nar = it.narration.reduce((a, id) => a + (m.narration[id]?.durationMs ?? 0), 0);
    ms += Math.max(it.loops * 8000, nar) + 600;
  }
  return Math.round(ms / 60000);
}
