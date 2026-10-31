// סיום מפגש: שאלת בטיחות (ברך/גב/סחרחורת), "איך היה?", שמירה ב-Dexie, סיכום. בלי אשמה.
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, ensureProfile, todayISO } from '../db';
import { dayInWeek, summarizeWeek, WEEKLY_GOAL_MIN } from '../lib/week';
import { weekPlan } from '../content/plan';

interface FinishState { week: number; actualMin: number; status: 'done' | 'partial' | 'stopped'; plannedMin: number; movements: string[] }

export default function Finish() {
  const nav = useNavigate();
  const st = (useLocation().state ?? null) as FinishState | null;
  const [pain, setPain] = useState({ knee: false, back: false, dizzy: false });
  const [mood, setMood] = useState<1 | 2 | 3 | null>(null);
  const [step, setStep] = useState<'safety' | 'mood' | 'summary'>('safety');
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [kneeTwice, setKneeTwice] = useState(false);

  useEffect(() => { if (!st) nav('/', { replace: true }); }, [st, nav]);
  if (!st) return null;

  async function save() {
    const profile = await ensureProfile();
    const date = todayISO();
    const prev = await db.sessions.orderBy('id').last();
    await db.sessions.add({ date, week: st!.week, dayInWeek: dayInWeek(profile.startDate, date), track: profile.track, plannedMin: st!.plannedMin, actualMin: st!.actualMin, status: st!.status, movements: st!.movements, painKnee: pain.knee, painBack: pain.back, dizzy: pain.dizzy, mood });
    const rows = await db.sessions.where('week').equals(st!.week).toArray();
    setWeekMinutes(summarizeWeek(rows, profile.startDate, st!.week).minutes);
    setKneeTwice(pain.knee && !!prev?.painKnee);
    setStep('summary');
  }

  const Toggle = ({ k, label }: { k: keyof typeof pain; label: string }) => (
    <button className="chip w-full justify-between" aria-pressed={pain[k]} aria-label={label} onClick={() => setPain(p => ({ ...p, [k]: !p[k] }))}>
      <span>{label}</span><span>{pain[k] ? 'כן' : 'לא'}</span>
    </button>
  );

  if (step === 'safety') return (
    <section className="flex flex-col gap-5 pt-4">
      <h1 className="text-3xl font-extrabold">רגע לפני שמסיימים</h1>
      <p className="text-[var(--fg-soft)]">הרגשת היום משהו מאלה? סמן רק אם כן.</p>
      <Toggle k="knee" label="כאב ברך" /><Toggle k="back" label="כאב גב" /><Toggle k="dizzy" label="סחרחורת" />
      <button className="btn-primary" onClick={() => setStep('mood')}>המשך</button>
    </section>
  );

  if (step === 'mood') return (
    <section className="flex flex-col gap-5 pt-4">
      <h1 className="text-3xl font-extrabold">איך היה?</h1>
      <div className="flex gap-3">
        {([1, 2, 3] as const).map(v => (
          <button key={v} className="chip flex-1 justify-center text-3xl min-h-[80px]" aria-pressed={mood === v} aria-label={['קשה', 'בסדר', 'נעים'][v - 1]} onClick={() => setMood(v)}>
            {['😮‍💨', '🙂', '😌'][v - 1]}
          </button>
        ))}
      </div>
      <button className="btn-primary" onClick={save}>שמור את המפגש</button>
    </section>
  );

  const plan = weekPlan(st.week);
  return (
    <section className="flex flex-col gap-5 pt-4">
      <h1 className="text-3xl font-extrabold">{st.status === 'done' ? 'כל הכבוד על היום הזה' : 'נרשם. גם זה נספר.'}</h1>
      <div className="card p-5">
        <div className="text-5xl font-extrabold">{st.actualMin} <span className="text-xl font-semibold text-[var(--fg-soft)]">דקות</span></div>
        <p className="mt-2 text-[var(--fg-soft)]">השבוע: {weekMinutes} מתוך {WEEKLY_GOAL_MIN} דקות.</p>
      </div>
      {pain.dizzy && <p className="card p-4 border-[var(--color-bronze)]">דיווחת על סחרחורת. תנועות שיווי המשקל יושהו לשבוע, ונתרגל ליד כיסא.</p>}
      {kneeTwice && <p className="card p-4 border-[var(--color-bronze)]">כאב ברך פעמיים ברצף. המפגש הבא יוצע במסלול ישיבה. אם זה נמשך, כדאי רופא או פיזיותרפיסט.</p>}
      <p className="text-[var(--fg-soft)]">מחר: {plan.stage}, {plan.plannedMin} דקות.</p>
      <button className="btn-primary" onClick={() => nav('/', { replace: true })}>חזרה להיום</button>
    </section>
  );
}
