// תוכנית 12 השבועות + תחזוקה, ושלושה מסלולים, ובונה הפלייליסט למפגש.
// מבנה מפגש (סעיף 5): פתיח → חימום (לא ניתן לדלג 1–4) → ליבה (הדגמה → ביצוע משותף ×4–8 → מבט צד) → סיום → שאלת בטיחות.
import { approvedClip, movementOf, type Manifest } from './manifest';
import type { Track } from '../db';

/** יחידת תנועה = תמונת-מפתח אחת: קליף חזיתי, קליף צד (אופציונלי), קריינות. */
export interface Unit { front?: string; side?: string; cues: string[]; sideCue?: string; label: string; still?: string; balance?: boolean }
export interface MovementDef { id: string; units: Unit[]; intro?: string; outro?: string }

// ---------- מסלול ראשי: צורת 8 ----------
const OPENING: MovementDef = { id: 'opening', intro: 'opening_intro', units: [
  { side: 'weight_shift_side_arms', cues: ['opening_arms'], label: 'הידיים צפות' }, // מבט חזיתי נדחה ב-QA → הצד הוא הזווית הראשית
  { front: 'weight_shift_front_right', cues: ['weight_shift_cue2'], label: 'משקל לרגל ימין' },
  { front: 'weight_shift_front_left', cues: ['opening_left'], label: 'משקל לרגל שמאל' },
] };
const CLOUD_HANDS: MovementDef = { id: 'cloud_hands', intro: 'cloud_hands_intro', outro: 'cloud_hands_breath', units: [
  { front: 'cloud_hands_front', side: 'cloud_hands_side', cues: ['cloud_hands_cue1'], sideCue: 'cloud_hands_side', label: 'צד ימין' },
  { front: 'cloud_hands_left_front', side: 'cloud_hands_left_side', cues: ['cloud_hands_left'], label: 'צד שמאל' },
] };
const GRASP: MovementDef = { id: 'grasp_bird_tail', intro: 'grasp_bird_tail_intro', units: [
  { front: 'grasp_bird_tail_front', side: 'grasp_bird_tail_side', cues: ['grasp_bird_tail_cue1', 'grasp_bird_tail_cue2'], sideCue: 'grasp_bird_tail_side', label: 'הדיפה' },
  { front: 'grasp_bird_tail_rollback_front', side: 'grasp_bird_tail_rollback_side', cues: ['grasp_bird_tail_rollback'], label: 'משיכה' },
  { front: 'grasp_bird_tail_press_front', side: 'grasp_bird_tail_press_side', cues: ['grasp_bird_tail_press'], label: 'לחיצה' },
  { front: 'grasp_bird_tail_push_front', side: 'grasp_bird_tail_push_side', cues: ['grasp_bird_tail_push'], label: 'דחיפה' },
] };
const CROSS: MovementDef = { id: 'cross_hands', intro: 'cross_hands_intro', units: [{ front: 'cross_hands_front', side: 'cross_hands_side', cues: ['cross_hands_cue'], label: 'ידיים צולבות' }] };
const BRUSH: MovementDef = { id: 'brush_knee', intro: 'brush_knee_intro', units: [
  { front: 'brush_knee_left_front', side: 'brush_knee_left_side', cues: ['brush_knee_left'], sideCue: 'brush_knee_side', label: 'צד שמאל' },
  { front: 'brush_knee_right_front', side: 'brush_knee_right_side', cues: ['brush_knee_right'], label: 'צד ימין' },
] };
const ROOSTER: MovementDef = { id: 'golden_rooster', intro: 'golden_rooster_intro', units: [
  { front: 'golden_rooster_left_front', side: 'golden_rooster_side', cues: ['golden_rooster_left'], sideCue: 'golden_rooster_side', label: 'רגל שמאל', balance: true },
  { front: 'golden_rooster_right_front', cues: ['golden_rooster_right', 'golden_rooster_hold'], label: 'רגל ימין', balance: true },
] };
const HORSE: MovementDef = { id: 'wild_horse', intro: 'wild_horse_intro', units: [
  { front: 'wild_horse_left_front', side: 'wild_horse_left_side', cues: ['wild_horse_left'], sideCue: 'wild_horse_side', label: 'צד שמאל' },
  { front: 'wild_horse_right_front', side: 'wild_horse_right_side', cues: ['wild_horse_right'], label: 'צד ימין' },
] };
const MONKEY: MovementDef = { id: 'repulse_monkey', intro: 'repulse_monkey_intro', units: [
  { front: 'repulse_monkey_left_front', side: 'repulse_monkey_left_side', cues: ['repulse_monkey_left'], sideCue: 'repulse_monkey_side', label: 'צד שמאל' },
  { front: 'repulse_monkey_right_front', side: 'repulse_monkey_right_side', cues: ['repulse_monkey_right'], label: 'צד ימין' },
] };
const KICK: MovementDef = { id: 'heel_kick', intro: 'heel_kick_intro', units: [
  { front: 'heel_kick_right_front', side: 'heel_kick_side', cues: ['heel_kick_right'], sideCue: 'heel_kick_side', label: 'רגל ימין', balance: true },
  { front: 'heel_kick_left_front', cues: ['heel_kick_left'], label: 'רגל שמאל', balance: true },
] };
const CLOSING: MovementDef = { id: 'closing', intro: 'closing_intro', outro: 'closing_breath', units: [{ front: 'closing_front', side: 'closing_side', cues: [], label: 'סיום' }] };
const WARMUP: MovementDef = { id: 'warmup', intro: 'warm_intro', outro: 'warm_done', units: [
  { front: 'warm_ankle_front', cues: ['warm_ankle'], label: 'קרסוליים' },
  { still: 'warm_knee_side', cues: ['warm_knee'], label: 'ברכיים' }, // הקליף נדחה → סטיל + קריינות
  { front: 'warm_waist_front', cues: ['warm_waist'], label: 'גו' },
  { front: 'warm_shoulder_front', cues: ['warm_shoulder'], label: 'כתפיים' },
] };
// ---------- תוספות יאנג 24 ----------
const CRANE: MovementDef = { id: 'white_crane', units: [{ front: 'white_crane_front', side: 'white_crane_side', cues: ['white_crane'], label: 'העגור הלבן' }] };
const PIPA: MovementDef = { id: 'play_pipa', units: [{ front: 'play_pipa_front', side: 'play_pipa_side', cues: ['play_pipa'], label: 'נגינה בפיפה' }] };
const WHIP: MovementDef = { id: 'single_whip', units: [{ front: 'single_whip_front', side: 'single_whip_side', cues: ['single_whip'], label: 'שוט יחיד' }] };
const HORSE_PAT: MovementDef = { id: 'high_pat_horse', units: [{ front: 'high_pat_horse_front', side: 'high_pat_horse_side', cues: ['high_pat_horse'], label: 'טפיחה על הסוס' }] };
const NEEDLE: MovementDef = { id: 'needle_sea_bottom', units: [{ front: 'needle_sea_bottom_front', side: 'needle_sea_bottom_side', cues: ['needle_sea_bottom'], label: 'מחט' }] };
const FAN: MovementDef = { id: 'fan_through_back', units: [{ front: 'fan_through_back_front', side: 'fan_through_back_side', cues: ['fan_through_back'], label: 'מניפה' }] };
const SHUTTLE: MovementDef = { id: 'shuttle', units: [
  { front: 'shuttle_left_front', side: 'shuttle_side', cues: ['shuttle'], label: 'צד שמאל' },
  { front: 'shuttle_right_front', cues: [], label: 'צד ימין' },
] };
const PUNCH: MovementDef = { id: 'parry_punch', units: [
  { front: 'parry_front', cues: ['parry_punch'], label: 'הסטה וחסימה' },
  { front: 'punch_front', side: 'punch_side', cues: [], label: 'אגרוף' },
] };
const EARS: MovementDef = { id: 'strike_ears', units: [{ front: 'strike_ears_front', side: 'strike_ears_side', cues: ['strike_ears'], label: 'אגרופים לאוזניים' }] };
const CLOSE24: MovementDef = { id: 'apparent_close', units: [{ front: 'apparent_close_front', side: 'apparent_close_side', cues: ['apparent_close'], label: 'סגירה לכאורה' }] };
// ---------- מסלול ישיבה: Baduanjin ----------
const BDJ: MovementDef[] = [
  { id: 'bdj_heaven', units: [{ front: 'bdj_heaven_front', side: 'bdj_heaven_side', cues: ['bdj_heaven'], label: 'ידיים לשמיים' }] },
  { id: 'bdj_bow', units: [{ front: 'bdj_bow_left_front', cues: ['bdj_bow'], label: 'שמאל' }, { front: 'bdj_bow_right_front', cues: [], label: 'ימין' }] },
  { id: 'bdj_separate', units: [{ front: 'bdj_separate_left_front', cues: ['bdj_separate'], label: 'שמאל' }, { front: 'bdj_separate_right_front', cues: [], label: 'ימין' }] },
  { id: 'bdj_lookback', units: [{ front: 'bdj_lookback_left_front', cues: ['bdj_lookback'], label: 'שמאל' }, { front: 'bdj_lookback_right_front', cues: [], label: 'ימין' }] },
  { id: 'bdj_sway', units: [{ front: 'bdj_sway_left_front', cues: ['bdj_sway'], label: 'שמאל' }, { front: 'bdj_sway_right_front', cues: [], label: 'ימין' }] },
  { id: 'bdj_feet', units: [{ side: 'bdj_feet_side', cues: ['bdj_feet'], label: 'כפות הרגליים' }] },
  { id: 'bdj_fists', units: [{ front: 'bdj_fists_left_front', cues: ['bdj_fists'], label: 'שמאל' }, { front: 'bdj_fists_right_front', cues: [], label: 'ימין' }] },
  { id: 'bdj_heels', units: [{ still: 'bdj_heels_side', cues: ['bdj_heels'], label: 'עקבים' }] },
];

export interface WeekPlan { week: number; stage: string; core: MovementDef[]; plannedMin: number; reps: number; warmupSkippable: boolean; evidence: string; newMovements: string[]; sequence?: boolean; teacher?: string; celebrate?: string }

const FORM8 = [OPENING, CLOUD_HANDS, GRASP, CROSS, BRUSH, ROOSTER, HORSE, MONKEY];
export const WEEKS: WeekPlan[] = [
  { week: 1, stage: 'יסודות', core: [OPENING, CLOUD_HANDS], plannedMin: 12, reps: 4, warmupSkippable: false, evidence: 'שבוע 1: הגוף לומד איפה הוא במרחב. עדיין אין מה למדוד.', newMovements: ['עמידת פתיחה', 'ידיים כעננים'], teacher: 'teacher_w1' },
  { week: 2, stage: 'יסודות', core: [OPENING, CLOUD_HANDS, GRASP, CROSS], plannedMin: 15, reps: 4, warmupSkippable: false, evidence: 'שבוע 2: התנועות עדיין מגושמות, וזה כמו שצריך.', newMovements: ['אחיזת זנב הציפור', 'ידיים צולבות'], teacher: 'teacher_w2' },
  { week: 3, stage: 'צורת 8', core: [OPENING, CLOUD_HANDS, GRASP, CROSS, BRUSH], plannedMin: 20, reps: 5, warmupSkippable: false, evidence: 'שבוע 3: רצף ראשון. הנשימה מתחילה להוביל.', newMovements: ['ליטוף הברך וצעד', 'רצף ראשון'], sequence: true },
  { week: 4, stage: 'צורת 8', core: [OPENING, CLOUD_HANDS, GRASP, CROSS, BRUSH, ROOSTER], plannedMin: 20, reps: 6, warmupSkippable: false, evidence: 'שבוע 4: יסודות צורת 8 הושלמו. בשבוע 6 מודדים.', newMovements: ['תרנגול הזהב (ליד כיסא)'], sequence: true, teacher: 'teacher_w4' },
  { week: 5, stage: 'רצף', core: FORM8, plannedMin: 25, reps: 4, warmupSkippable: true, evidence: 'שבוע 5: רעמת הסוס והדיפת הקוף, בעמידה גבוהה. רצף מלא.', newMovements: ['פיצול רעמת הסוס', 'הדיפת הקוף'], sequence: true },
  { week: 6, stage: 'רצף', core: FORM8, plannedMin: 25, reps: 5, warmupSkippable: true, evidence: 'שבוע 6: כאן הניסויים ראו שינוי ראשון בשיווי המשקל ובכוח הרגליים. מודדים.', newMovements: [], sequence: true, teacher: 'teacher_w6', celebrate: 'celebrate_w6' },
  { week: 7, stage: 'עומק', core: [...FORM8, KICK], plannedMin: 30, reps: 5, warmupSkippable: true, evidence: 'שבוע 7: בעיטת עקב ליד כיסא. דגש על נשימה.', newMovements: ['בעיטת עקב (ליד כיסא)'], sequence: true },
  { week: 8, stage: 'עומק', core: [...FORM8, KICK], plannedMin: 30, reps: 6, warmupSkippable: true, evidence: 'שבוע 8: שינה ומצב רוח מתחילים להשתנות (8–12). הרצף פעמיים.', newMovements: [], sequence: true, teacher: 'teacher_w8' },
  { week: 9, stage: 'עומק', core: [...FORM8, KICK], plannedMin: 30, reps: 6, warmupSkippable: true, evidence: 'שבוע 9: צורת 8 שלמה וחלקה, פעמיים, בלי מילים באמצע.', newMovements: [], sequence: true },
  { week: 10, stage: 'צורת 24', core: [OPENING, CLOUD_HANDS, GRASP, CRANE, PIPA, WHIP], plannedMin: 30, reps: 5, warmupSkippable: true, evidence: 'שבוע 10: שלוש תנועות ראשונות מצורת 24.', newMovements: ['העגור הלבן', 'נגינה בפיפה', 'שוט יחיד'] },
  { week: 11, stage: 'צורת 24', core: [OPENING, CRANE, PIPA, WHIP, HORSE_PAT, NEEDLE, FAN], plannedMin: 30, reps: 5, warmupSkippable: true, evidence: 'שבוע 11: טפיחה על הסוס, מחט, מניפה.', newMovements: ['טפיחה גבוהה על הסוס', 'מחט בקרקעית הים', 'מניפה דרך הגב'] },
  { week: 12, stage: 'צורת 24', core: [OPENING, HORSE_PAT, NEEDLE, FAN, SHUTTLE, PUNCH, EARS, CLOSE24], plannedMin: 30, reps: 5, warmupSkippable: true, evidence: 'שבוע 12: השבוע האחרון. מודדים, ומשווים לבסיס.', newMovements: ['העלמה אורגת', 'הסטה חסימה ואגרוף', 'אגרופים לאוזניים', 'סגירה לכאורה'], teacher: 'teacher_w12', celebrate: 'celebrate_w12' },
];
/** שבוע 13+: תחזוקה — ערבוב: צורת 8, צורת 24, ישיבה בימים קשים. */
const MAINTENANCE: WeekPlan[] = [
  { week: 13, stage: 'תחזוקה', core: [...FORM8, KICK], plannedMin: 25, reps: 5, warmupSkippable: true, evidence: 'תחזוקה: צורת 8 מלאה. ההגנה מפני נפילות דועכת כשמפסיקים.', newMovements: [], sequence: true },
  { week: 14, stage: 'תחזוקה', core: [OPENING, CLOUD_HANDS, GRASP, CRANE, PIPA, WHIP, HORSE_PAT, NEEDLE, FAN, SHUTTLE, PUNCH, EARS, CLOSE24], plannedMin: 30, reps: 4, warmupSkippable: true, evidence: 'תחזוקה: עשר התנועות מצורת 24.', newMovements: [] },
];
export function weekPlan(week: number): WeekPlan {
  if (week <= 12) return WEEKS[Math.max(1, week) - 1]!;
  return MAINTENANCE[(week - 13) % MAINTENANCE.length]!;
}

export interface PlaylistItem {
  key: string; movementId: string; title: string; caption: string;
  phase: 'open' | 'warmup' | 'core' | 'close'; mode: 'demo' | 'together' | 'side';
  frontUrl?: string; sideUrl?: string; stillUrl: string;
  loops: number; narration: string[]; narrationEnd: string[];
  sideAvailable: boolean; skippable: boolean;
}
export interface SessionOpts { short?: boolean; track?: Track; firstOfWeek?: boolean; skipBalance?: boolean }

export function buildSession(m: Manifest, week: number, opts: SessionOpts = {}): { items: PlaylistItem[]; plannedMin: number; plan: WeekPlan } {
  const plan = weekPlan(week);
  const track = opts.track ?? 'main';
  const items: PlaylistItem[] = [];
  const charStill = m.character.front.replace(/^content\//, '');
  const url = (id?: string) => (id ? approvedClip(m, id)?.url : undefined);
  const stillOf = (id?: string) => { if (!id) return charStill; for (const mv of m.movements) for (const c of mv.clips) if (c.id === id && c.still) return c.still; return charStill; };
  const nameOf = (id: string) => movementOf(m, id)?.nameHe ?? id;
  const reps = opts.short ? 2 : plan.reps;
  const seated = track === 'seated';

  const openNar = [seated ? 'session_open_seated' : 'session_open', ...(seated ? [] : [`session_open_w${Math.min(12, week)}`]), 'safety_reminder', ...(opts.firstOfWeek && plan.teacher && !seated ? [plan.teacher] : [])];
  items.push({ key: 'open', movementId: 'opening', title: 'פתיח', caption: `שבוע ${week}`, phase: 'open', mode: 'demo', stillUrl: seated ? (m.character.seatedFront || charStill) : charStill, loops: 0, narration: openNar, narrationEnd: [], sideAvailable: false, skippable: false });

  const pushMovement = (def: MovementDef, phase: PlaylistItem['phase'], repsHere: number) => {
    def.units.forEach((u, i) => {
      if (opts.skipBalance && u.balance) return; // סחרחורת: תנועות שיווי משקל מושהות
      const f = url(u.front), s = url(u.side);
      const primaryIsSide = !f && !!s;
      const base = { movementId: def.id, title: nameOf(def.id), stillUrl: stillOf(u.still ?? u.front ?? u.side), phase, sideAvailable: !!s && !!f, skippable: phase !== 'warmup' || plan.warmupSkippable, narrationEnd: [] as string[] };
      const cues = [...(i === 0 && def.intro ? [def.intro] : []), ...u.cues];
      if (!f && !s) { items.push({ ...base, key: `${def.id}-${i}-still`, caption: u.label, mode: 'demo', loops: 0, narration: cues }); return; }
      const common = primaryIsSide ? { frontUrl: s, sideUrl: undefined } : { frontUrl: f, sideUrl: s };
      items.push({ ...base, ...common, key: `${def.id}-${i}-demo`, caption: `${u.label} · הדגמה`, mode: 'demo', loops: 1, narration: cues });
      if (phase === 'core') {
        items.push({ ...base, ...common, key: `${def.id}-${i}-together`, caption: `${u.label} · ביחד ×${repsHere}`, mode: 'together', loops: repsHere, narration: i === 0 ? ['breath_cue'] : [] });
        if (s && f) items.push({ ...base, ...common, key: `${def.id}-${i}-side`, caption: `${u.label} · מבט צד`, mode: 'side', loops: 1, narration: u.sideCue ? [u.sideCue] : [] });
      } else {
        items.push({ ...base, ...common, key: `${def.id}-${i}-together`, caption: `${u.label} · ביחד`, mode: 'together', loops: repsHere, narration: [] });
      }
    });
    if (def.outro) { const last = items[items.length - 1]; if (last) last.narrationEnd = [...last.narrationEnd, def.outro]; }
  };

  if (seated) {
    const first = items[0]; if (first) first.narration.push('bdj_intro');
    for (const def of BDJ) pushMovement(def, 'core', opts.short ? 2 : 3);
    const last = items[items.length - 1]; if (last) last.narrationEnd.push('bdj_close');
    items.push({ key: 'close-words', movementId: 'closing', title: 'סיום', caption: 'שתי נשימות', phase: 'close', mode: 'demo', stillUrl: m.character.seatedFront || charStill, loops: 0, narration: ['session_close_short'], narrationEnd: [], sideAvailable: false, skippable: false });
    return { items, plannedMin: opts.short ? 10 : 20, plan };
  }

  pushMovement(WARMUP, 'warmup', opts.short ? 1 : week >= 5 ? 1 : 2);
  for (const def of plan.core) pushMovement(def, 'core', reps);
  if (plan.sequence && !opts.short) {
    const last = items[items.length - 1];
    if (last) last.narrationEnd.push(week >= 5 ? 'form8_intro' : 'sequence_intro', ...(week >= 8 ? ['form8_breath'] : []));
  }
  pushMovement(CLOSING, 'close', 1);
  const closeNar = ['session_close', ...(opts.firstOfWeek && plan.celebrate ? [plan.celebrate] : []), ...(week >= 10 && opts.firstOfWeek ? ['form24_note'] : [])];
  items.push({ key: 'close-words', movementId: 'closing', title: 'סיום', caption: 'שלוש נשימות', phase: 'close', mode: 'demo', stillUrl: charStill, loops: 0, narration: closeNar, narrationEnd: [], sideAvailable: false, skippable: false });

  return { items, plannedMin: opts.short ? 10 : plan.plannedMin, plan };
}

/** אומדן משך בדקות מתוך הפלייליסט (לולאות × 8 ש' + קריינות שאינה חופפת). */
export function estimateMinutes(m: Manifest, items: PlaylistItem[]): number {
  let ms = 0;
  for (const it of items) {
    const nar = it.narration.reduce((a, id) => a + (m.narration[id]?.durationMs ?? 0), 0);
    const narEnd = it.narrationEnd.reduce((a, id) => a + (m.narration[id]?.durationMs ?? 0), 0);
    ms += Math.max(it.loops * 8000, nar) + narEnd + 600;
  }
  return Math.round(ms / 60000);
}
