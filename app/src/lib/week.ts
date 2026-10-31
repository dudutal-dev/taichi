// חישובי שבוע: טבעת 150, שבוע ירוק (≥3 מפגשים), רצף שבועות. בלי אשמה: יום שפוספס לא מאפס כלום.
import type { SessionRow } from '../db';

export const WEEKLY_GOAL_MIN = 150;
export const GREEN_WEEK_SESSIONS = 3;

export function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO + 'T00:00:00'), b = new Date(bISO + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** מספר השבוע בתוכנית (1..), לפי תאריך ההתחלה. */
export function weekNumber(startISO: string, dateISO: string): number {
  return Math.max(1, Math.floor(daysBetween(startISO, dateISO) / 7) + 1);
}

/** 0..6 — מיקום היום בתוך השבוע הנוכחי של התוכנית. */
export function dayInWeek(startISO: string, dateISO: string): number {
  return ((daysBetween(startISO, dateISO) % 7) + 7) % 7;
}

export interface WeekSummary {
  week: number;
  minutes: number;
  sessions: number;        // מפגשים שנספרים (done או partial עם דקות)
  ringFraction: number;    // 0..1
  green: boolean;
  days: boolean[];         // 7 ימים — האם היה מפגש
}

/** מסכם שבוע אחד מתוך רשימת מפגשים. מפגש של 10 דק' ("רשת ביטחון") נספר בדקות ולא כ"יום הושלם". */
export function summarizeWeek(sessions: SessionRow[], startISO: string, week: number): WeekSummary {
  const rows = sessions.filter(s => s.week === week && s.actualMin > 0);
  const minutes = rows.reduce((a, s) => a + s.actualMin, 0);
  const fullSessions = rows.filter(s => s.status === 'done').length;
  const days = Array.from({ length: 7 }, (_, d) => rows.some(s => dayInWeek(startISO, s.date) === d && s.status === 'done'));
  return { week, minutes, sessions: fullSessions, ringFraction: Math.min(1, minutes / WEEKLY_GOAL_MIN), green: fullSessions >= GREEN_WEEK_SESSIONS, days };
}

/** רצף שבועות ירוקים עד השבוע הנתון (כולל), נספר אחורה. */
export function greenStreak(sessions: SessionRow[], startISO: string, currentWeek: number): number {
  let streak = 0;
  for (let w = currentWeek; w >= 1; w--) {
    if (summarizeWeek(sessions, startISO, w).green) streak++;
    else if (w !== currentWeek) break; // השבוע הנוכחי עוד לא נגמר — לא שובר רצף
  }
  return streak;
}
