// סיום מפגש: שאלת בטיחות (ברך/גב/סחרחורת), "איך היה?", שמירה ב-Dexie, התאמות אוטומטיות, חגיגה שקטה, סיכום. בלי אשמה.
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, getProfile, todayISO } from '../db';
import { dayInWeek, summarizeWeek, greenStreak, WEEKLY_GOAL_MIN } from '../lib/week';
import { weekPlan } from '../content/plan';
import { adviseAfterSession } from '../lib/adapt';
import { contentUrl } from '../content/manifest';

interface FinishState { week: number; actualMin: number; status: 'done' | 'partial' | 'stopped'; plannedMin: number; movements: string[] }

// רכיב ברמת המודול (לא בתוך הרינדור) — אחרת הכפתור נבנה מחדש בכל עדכון והנגיעה בטלפון "נופלת"
function YesNo({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <button className="chip w-full justify-between" aria-pressed={value} aria-label={label} onClick={onToggle}>
      <span>{label}</span><span>{value ? 'כן' : 'לא'}</span>
    </button>
  );
}

export default function Finish() {
  const nav = useNavigate();
  const st = (useLocation().state ?? null) as FinishState | null;
  const [pain, setPain] = useState({ knee: false, back: false, dizzy: false });
  const [mood, setMood] = useState<1 | 2 | 3 | null>(null);
  const [step, setStep] = useState<'safety' | 'mood' | 'summary'>('safety');
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [advice, setAdvice] = useState<string[]>([]);
  const [celebrate, setCelebrate] = useState<string | null>(null);

  useEffect(() => { if (!st) nav('/', { replace: true }); }, [st, nav]);
  if (!st) return null;

  async function save() {
    const profile = await getProfile(); if (!profile) return;
    const date = todayISO();
    const prev = await db.sessions.orderBy('id').last();
    const row = { date, week: st!.week, dayInWeek: dayInWeek(profile.startDate, date), track: profile.track, plannedMin: st!.plannedMin, actualMin: st!.actualMin, status: st!.status, movements: st!.movements, painKnee: pain.knee, painBack: pain.back, dizzy: pain.dizzy, mood };
    await db.sessions.add(row);
    const adv = adviseAfterSession(row, prev, date);
    await db.profile.put({ ...profile, suggestSeatedNext: adv.suggestSeatedNext, suspendBalanceUntil: adv.suspendBalanceUntil ?? profile.suspendBalanceUntil });
    setAdvice(adv.messages);
    const all = await db.sessions.toArray();
    const ws = summarizeWeek(all, profile.startDate, st!.week);
    setWeekMinutes(ws.minutes);
    // חגיגות שקטות: שבוע ירוק (בדיוק כשהגיע ל-3), שלושה שבועות ברצף, סיום שבוע 4 (צורת 8 יסודות)
    const streak = greenStreak(all, profile.startDate, st!.week);
    const c = ws.sessions === 3 && st!.status === 'done' ? 'celebrate_green_week' : streak === 3 && ws.sessions === 3 ? 'celebrate_3_weeks' : st!.week === 4 && ws.sessions === 5 ? 'celebrate_form8' : null;
    if (c) { setCelebrate(c); try { new Audio(contentUrl(`audio/narration/${c}.mp3`)).play(); } catch { /* */ } }
    setStep('summary');
  }

  const toggle = (k: keyof typeof pain) => setPain(p => ({ ...p, [k]: !p[k] }));

  if (step === 'safety') return (
    <section className="flex flex-col gap-5 pt-4">
      <h1 className="text-3xl font-extrabold">רגע לפני שמסיימים</h1>
      <p className="text-[var(--fg-soft)]">הרגשת היום משהו מאלה? סמן רק אם כן.</p>
      <YesNo label="כאב ברך" value={pain.knee} onToggle={() => toggle('knee')} />
      <YesNo label="כאב גב" value={pain.back} onToggle={() => toggle('back')} />
      <YesNo label="סחרחורת" value={pain.dizzy} onToggle={() => toggle('dizzy')} />
      <button className="btn-primary" onClick={() => setStep('mood')}>המשך</button>
    </section>
  );

  if (step === 'mood') return (
    <section className="flex flex-col gap-5 pt-4">
      <h1 className="text-3xl font-extrabold">איך היה?</h1>
      <div className="flex gap-3">
        {([1, 2, 3] as const).map(v => (
          <button key={v} className="chip flex-1 justify-center text-3xl min-h-[80px]" aria-pressed={mood === v} aria-label={['קשה', 'בסדר', 'נעים'][v - 1]} onClick={() => setMood(v)}>{['😮‍💨', '🙂', '😌'][v - 1]}</button>
        ))}
      </div>
      <button className="btn-primary" onClick={save}>שמור את המפגש</button>
    </section>
  );

  const plan = weekPlan(st.week);
  const CELEB: Record<string, string> = { celebrate_green_week: 'שבוע ירוק. שלושה מפגשים לפחות. זה מה שבונה את ההרגל.', celebrate_3_weeks: 'שלושה שבועות ברצף.', celebrate_form8: 'צורת שמונה שלמה, מהפתיחה ועד הסיום.' };
  return (
    <section className="flex flex-col gap-5 pt-4">
      <h1 className="text-3xl font-extrabold">{st.status === 'done' ? 'כל הכבוד על היום הזה' : 'נרשם. גם זה נספר.'}</h1>
      {celebrate && <div className="card p-5 border-[var(--color-bamboo)] border-2 text-xl font-extrabold text-[var(--color-bamboo)]">{CELEB[celebrate]}</div>}
      <div className="card p-5">
        <div className="text-5xl font-extrabold">{st.actualMin} <span className="text-xl font-semibold text-[var(--fg-soft)]">דקות</span></div>
        <p className="mt-2 text-[var(--fg-soft)]">השבוע: {weekMinutes} מתוך {WEEKLY_GOAL_MIN} דקות.</p>
      </div>
      {advice.map(a => <p key={a} className="card p-4 border-[var(--color-bronze)]">{a}</p>)}
      <p className="text-[var(--fg-soft)]">מחר: {plan.stage}, {plan.plannedMin} דקות.</p>
      <button className="btn-primary" onClick={() => nav('/', { replace: true })}>חזרה להיום</button>
    </section>
  );
}
