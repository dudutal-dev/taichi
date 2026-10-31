// בטיחות (סעיף 9): סינון כניסה → התאמות אוטומטיות; ניטור כאב → התאמות אחרי מפגש. הכול דטרמיניסטי וניתן לבדיקה.
import type { SessionRow, Track } from '../db';

export const SCREENING_QUESTIONS = [
  { key: 'osteoporosis', text: 'אוסטאופורוזיס חמורה' },
  { key: 'surgery12m', text: 'שבר, ניתוח או החלפת מפרק ב-12 החודשים האחרונים' },
  { key: 'kneePain', text: 'כאב ברך קיים' },
  { key: 'vertigo', text: 'ורטיגו או סחרחורות' },
  { key: 'heart', text: 'מחלת לב' },
  { key: 'acuteInjury', text: 'פציעה חריפה' },
] as const;
export type ScreeningKey = typeof SCREENING_QUESTIONS[number]['key'];
export type Screening = Partial<Record<ScreeningKey, boolean>>;

export interface Adaptations {
  suggestedTrack: Track;      // מסלול מומלץ
  nearChair: boolean;         // "ליד כיסא" קבוע
  skipTurnsAndKicks: boolean; // דילוג על תנועות סיבוב ובעיטה
  maxSessionMinWeeks1to4: number | null; // לב: ≤20 דק' בשבועות 1–4
  doctorAdvised: boolean;     // "מומלץ לאשר עם רופא"
  reasons: string[];
}

/** סינון כניסה → התאמות. כל "כן" → הודעה "מומלץ לאשר עם רופא" + התאמה. */
export function adaptFromScreening(s: Screening): Adaptations {
  const a: Adaptations = { suggestedTrack: 'main', nearChair: false, skipTurnsAndKicks: false, maxSessionMinWeeks1to4: null, doctorAdvised: false, reasons: [] };
  const yes = (k: ScreeningKey) => s[k] === true;
  if (yes('kneePain') || yes('surgery12m')) { a.suggestedTrack = 'joints'; a.reasons.push('כאב ברך או ניתוח: מסלול מפרקים רגישים'); }
  if (yes('vertigo')) { a.nearChair = true; a.skipTurnsAndKicks = true; a.reasons.push('סחרחורות: תמיד ליד כיסא, בלי סיבובים ובעיטות'); }
  if (yes('heart')) { a.maxSessionMinWeeks1to4 = 20; a.reasons.push('מחלת לב: מפגשים עד 20 דקות בשבועות 1–4'); }
  if (yes('osteoporosis')) { a.nearChair = true; a.reasons.push('אוסטאופורוזיס: ליד כיסא, בלי סיבובי גו עמוקים'); }
  if (yes('acuteInjury')) { a.suggestedTrack = 'seated'; a.reasons.push('פציעה חריפה: להתחיל במסלול ישיבה'); }
  a.doctorAdvised = SCREENING_QUESTIONS.some(q => yes(q.key));
  return a;
}

export interface PostSessionAdvice {
  suggestSeatedNext: boolean;   // כאב ברך פעמיים ברצף
  suspendBalanceUntil: string | null; // סחרחורת → תנועות שיווי משקל מושהות לשבוע (ISO)
  messages: string[];
}

/** ניטור כאב אחרי מפגש: שני המפגשים האחרונים (האחרון ראשון). */
export function adviseAfterSession(last: SessionRow, previous: SessionRow | undefined, todayISO: string): PostSessionAdvice {
  const out: PostSessionAdvice = { suggestSeatedNext: false, suspendBalanceUntil: null, messages: [] };
  if (last.painKnee && previous?.painKnee) {
    out.suggestSeatedNext = true;
    out.messages.push('כאב ברך פעמיים ברצף. המפגש הבא יוצע במסלול ישיבה. אם זה נמשך, רופא או פיזיותרפיסט.');
  }
  if (last.dizzy) {
    const d = new Date(todayISO + 'T00:00:00'); d.setDate(d.getDate() + 7);
    const pad = (n: number) => String(n).padStart(2, '0');
    out.suspendBalanceUntil = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // תאריך מקומי, לא UTC
    out.messages.push('דיווחת על סחרחורת. תנועות שיווי המשקל מושהות לשבוע, ומתרגלים ליד כיסא.');
  }
  return out;
}

/** תזכורת רכה אחרי יומיים בלי תרגול — הזמנה, לא משימה. */
export function softNudge(lastSessionISO: string | null, todayISO: string): string | null {
  if (!lastSessionISO) return null;
  const days = Math.round((new Date(todayISO + 'T00:00:00').getTime() - new Date(lastSessionISO + 'T00:00:00').getTime()) / 86400000);
  return days >= 2 ? 'יומיים בלי תרגול. עשר דקות היום? הבמבוק מחכה.' : null;
}
