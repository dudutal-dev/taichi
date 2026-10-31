import { describe, it, expect } from 'vitest';
import { summarizeWeek, greenStreak, weekNumber, dayInWeek } from './week';
import type { SessionRow } from '../db';

const start = '2026-11-01';
const s = (date: string, actualMin: number, status: SessionRow['status'] = 'done', week = 1): SessionRow =>
  ({ date, week, dayInWeek: dayInWeek(start, date), track: 'main', plannedMin: 20, actualMin, status, movements: [], painKnee: false, painBack: false, dizzy: false, mood: null });

describe('טבעת 150 ושבועות ירוקים — 4 התרחישים מקריטריוני הקבלה', () => {
  it('שבוע מלא: 5 מפגשים × 30 = 150, טבעת מלאה, ירוק', () => {
    const rows = ['01', '02', '03', '04', '05'].map(d => s(`2026-11-${d}`, 30));
    const w = summarizeWeek(rows, start, 1);
    expect(w.minutes).toBe(150); expect(w.ringFraction).toBe(1); expect(w.green).toBe(true); expect(w.sessions).toBe(5);
  });
  it('3 מפגשים: 60 דקות, טבעת 0.4, ירוק', () => {
    const w = summarizeWeek(['01', '03', '05'].map(d => s(`2026-11-${d}`, 20)), start, 1);
    expect(w.minutes).toBe(60); expect(w.ringFraction).toBeCloseTo(0.4); expect(w.green).toBe(true);
  });
  it('2 מפגשים + 10 דקות: הדקות נספרות, לא ירוק', () => {
    const rows = [s('2026-11-01', 20), s('2026-11-02', 20), s('2026-11-03', 10, 'partial')];
    const w = summarizeWeek(rows, start, 1);
    expect(w.minutes).toBe(50); expect(w.sessions).toBe(2); expect(w.green).toBe(false);
    expect(w.days.filter(Boolean).length).toBe(2);
  });
  it('שבוע ריק: אפס, לא ירוק, הטבעת ריקה', () => {
    const w = summarizeWeek([], start, 1);
    expect(w.minutes).toBe(0); expect(w.ringFraction).toBe(0); expect(w.green).toBe(false);
  });
  it('עצירה באמצע לא נספרת כמפגש אבל הדקות נספרות', () => {
    const w = summarizeWeek([s('2026-11-01', 7, 'stopped')], start, 1);
    expect(w.minutes).toBe(7); expect(w.sessions).toBe(0);
  });
});

describe('שבוע ורצף', () => {
  it('מספר שבוע ויום בשבוע', () => {
    expect(weekNumber(start, '2026-11-01')).toBe(1);
    expect(weekNumber(start, '2026-11-08')).toBe(2);
    expect(dayInWeek(start, '2026-11-07')).toBe(6);
  });
  it('רצף שבועות ירוקים לא נשבר על ידי השבוע הנוכחי שעוד לא נגמר', () => {
    const rows = [
      ...['01', '02', '03'].map(d => s(`2026-11-${d}`, 20, 'done', 1)),
      ...['08', '09', '10'].map(d => s(`2026-11-${d}`, 20, 'done', 2)),
      s('2026-11-15', 20, 'done', 3),
    ];
    expect(greenStreak(rows, start, 3)).toBe(2);
    expect(greenStreak(rows, start, 2)).toBe(2);
  });
});
