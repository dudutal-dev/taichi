import { describe, it, expect } from 'vitest';
import { adaptFromScreening, adviseAfterSession, softNudge } from './adapt';
import type { SessionRow } from '../db';

const row = (p: Partial<SessionRow>): SessionRow => ({ date: '2026-11-01', week: 1, dayInWeek: 0, track: 'main', plannedMin: 20, actualMin: 20, status: 'done', movements: [], painKnee: false, painBack: false, dizzy: false, mood: null, ...p });

describe('סינון כניסה → התאמות (סעיף 9)', () => {
  it('בלי "כן": מסלול ראשי, בלי רופא', () => {
    const a = adaptFromScreening({});
    expect(a.suggestedTrack).toBe('main'); expect(a.doctorAdvised).toBe(false); expect(a.reasons).toHaveLength(0);
  });
  it('כאב ברך → מפרקים רגישים + רופא', () => {
    const a = adaptFromScreening({ kneePain: true });
    expect(a.suggestedTrack).toBe('joints'); expect(a.doctorAdvised).toBe(true);
  });
  it('ורטיגו → ליד כיסא + בלי סיבובים ובעיטות', () => {
    const a = adaptFromScreening({ vertigo: true });
    expect(a.nearChair).toBe(true); expect(a.skipTurnsAndKicks).toBe(true);
  });
  it('לב → מפגשים ≤20 דק׳ בשבועות 1–4', () => {
    expect(adaptFromScreening({ heart: true }).maxSessionMinWeeks1to4).toBe(20);
  });
});

describe('ניטור כאב אחרי מפגש', () => {
  it('כאב ברך פעמיים ברצף → הצעת מסלול ישיבה', () => {
    const r = adviseAfterSession(row({ painKnee: true }), row({ painKnee: true }), '2026-11-02');
    expect(r.suggestSeatedNext).toBe(true);
  });
  it('כאב ברך פעם אחת → בלי הצעה', () => {
    expect(adviseAfterSession(row({ painKnee: true }), row({}), '2026-11-02').suggestSeatedNext).toBe(false);
  });
  it('סחרחורת → השהיית שיווי משקל לשבוע', () => {
    expect(adviseAfterSession(row({ dizzy: true }), undefined, '2026-11-02').suspendBalanceUntil).toBe('2026-11-09');
  });
});

describe('תזכורת רכה', () => {
  it('אחרי יומיים — הזמנה, לא אשמה', () => {
    expect(softNudge('2026-11-01', '2026-11-03')).toContain('הבמבוק מחכה');
    expect(softNudge('2026-11-02', '2026-11-03')).toBeNull();
  });
});
