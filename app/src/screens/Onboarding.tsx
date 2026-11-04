// פתיחה (פעם אחת): מה זה + ציפיות כנות → הצהרה → סינון בריאותי → מסלול + שעת תזכורת → מדידת בסיס + הודעת מורה ראשונה.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, blankProfile, DEFAULT_SETTINGS, type Track } from '../db';
import { SCREENING_QUESTIONS, adaptFromScreening, type Screening } from '../lib/adapt';
import TopBar from '../components/TopBar';

const TRACKS: { id: Track; name: string; text: string }[] = [
  { id: 'main', name: 'ראשי', text: 'צורת 8 ואז צורת 24. עמידה גבוהה.' },
  { id: 'joints', name: 'מפרקים רגישים', text: 'טאי צ\'י לדלקת מפרקים (סגנון Sun). עדין יותר לברכיים. הסרטונים של המסלול הזה עדיין בהפקה: עד אז מקבלים את המסלול הראשי בלי התנועות שמעמיסות על הברך.' },
  { id: 'seated', name: 'ישיבה', text: 'שמונה המקטעים על כיסא. לימים קשים או להתחלה.' },
];
const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const STEP_TITLES = ['ברוכים הבאים', 'לפני שמתחילים', 'שאלות על הבריאות', 'המסלול והשעה'];
function Step({ children, n, onBack }: { children: React.ReactNode; n: number; onBack?: () => void }) {
  return (
    <section className="flex flex-col gap-5 pb-6 min-h-[70dvh]">
      <TopBar title={STEP_TITLES[n] ?? ''} step={`שלב ${n + 1} מתוך 4`} onBack={onBack} exitTo="/onboarding" exitLabel="מההתחלה" />
      {children}
    </section>
  );
}

export default function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [screening, setScreening] = useState<Screening>({});
  const [track, setTrack] = useState<Track>('main');
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [time, setTime] = useState('08:00');
  const adapt = adaptFromScreening(screening);

  async function finish() {
    const p = blankProfile();
    Object.assign(p, { track, reminderDays: days, reminderTime: time, screening: screening as Record<string, boolean>, onboarded: true, nearChair: adapt.nearChair, skipTurnsAndKicks: adapt.skipTurnsAndKicks, maxSessionMinWeeks1to4: adapt.maxSessionMinWeeks1to4 });
    await db.profile.put(p);
    if (!(await db.settings.get(1))) await db.settings.put(DEFAULT_SETTINGS);
    nav('/measure/0', { replace: true });
  }

  if (step === 0) return (
    <Step n={0}>
      <h1 className="text-3xl font-extrabold">טאי צ'י 150</h1>
      <p className="text-xl">תרגול טאי צ'י בבית, בעברית, בקצב שלך. היעד: 150 דקות בשבוע, חמישה מפגשים של 20 עד 30 דקות, 12 שבועות.</p>
      <div className="card p-5 flex flex-col gap-2">
        <h2 className="font-extrabold text-lg">למה לצפות, ומתי</h2>
        <p>שיווי משקל וכוח רגליים: סביב שבוע 6.</p>
        <p>שינה ומצב רוח: שבועות 8 עד 12.</p>
        <p>לחץ דם: מעבר ל-12 שבועות.</p>
        <p>פחות נפילות: אחרי חצי שנה.</p>
        <p className="text-[var(--fg-soft)]">אלה המספרים מהניסויים. לא "תוצאות תוך ימים".</p>
      </div>
      <p className="text-[var(--fg-soft)]">ארבעת השבועות הראשונים כדאי ללמוד גם עם מדריך, בחוג או בזום. האפליקציה היא השגרה, המדריך רואה מה שהמצלמה לא.</p>
      <button className="btn-primary mt-auto" onClick={() => setStep(1)}>המשך</button>
    </Step>
  );

  if (step === 1) return (
    <Step n={1} onBack={() => setStep(0)}>
      <h1 className="text-3xl font-extrabold">לפני שמתחילים</h1>
      <p className="text-xl">האפליקציה אינה תחליף לייעוץ רפואי. היא לא מבטיחה ירידה במשקל, ריפוי, או תחליף לאימון כוח.</p>
      <p className="text-[var(--fg-soft)]">כל הנתונים נשמרים רק במכשיר הזה. אין חשבון, אין שרת, אין פרסומות.</p>
      <button className="btn-primary mt-auto" onClick={() => setStep(2)}>הבנתי, המשך</button>
    </Step>
  );

  if (step === 2) return (
    <Step n={2} onBack={() => setStep(1)}>
      <h1 className="text-3xl font-extrabold">כמה שאלות על הבריאות</h1>
      <p className="text-[var(--fg-soft)]">סמן רק מה שנכון. התשובות נשארות במכשיר ומתאימות את התוכנית.</p>
      {SCREENING_QUESTIONS.map(q => (
        <button key={q.key} className="chip w-full justify-between text-start" aria-pressed={!!screening[q.key]} aria-label={q.text} onClick={() => setScreening(s => ({ ...s, [q.key]: !s[q.key] }))}>
          <span>{q.text}</span><span>{screening[q.key] ? 'כן' : 'לא'}</span>
        </button>
      ))}
      {adapt.doctorAdvised && (
        <div className="card p-4 border-[var(--color-bronze)]">
          <p className="font-extrabold">מומלץ לאשר עם רופא לפני שמתחילים.</p>
          <ul className="mt-2 list-disc ps-5">{adapt.reasons.map(r => <li key={r}>{r}</li>)}</ul>
        </div>
      )}
      <button className="btn-primary mt-auto" onClick={() => { setTrack(adapt.suggestedTrack); setStep(3); }}>המשך</button>
    </Step>
  );

  return (
    <Step n={3} onBack={() => setStep(2)}>
      <h1 className="text-3xl font-extrabold">המסלול והשעה שלך</h1>
      <div className="flex flex-col gap-2">
        {TRACKS.map(t => (
          <button key={t.id} className="chip w-full justify-start flex-col items-start !py-3 !h-auto" aria-pressed={track === t.id} onClick={() => setTrack(t.id)}>
            <span className="font-extrabold">{t.name}{adapt.suggestedTrack === t.id && adapt.reasons.length ? ' · מומלץ לך' : ''}</span>
            <span className="text-[var(--fg-soft)] font-normal">{t.text}</span>
          </button>
        ))}
      </div>
      <div>
        <div className="font-extrabold mb-2">באילו ימים?</div>
        <div className="flex gap-2">{DAYS.map((d, i) => <button key={i} className="chip flex-1 justify-center" aria-pressed={days.includes(i)} onClick={() => setDays(ds => ds.includes(i) ? ds.filter(x => x !== i) : [...ds, i].sort())}>{d}</button>)}</div>
      </div>
      <label className="flex items-center justify-between gap-3">
        <span className="font-extrabold">באיזו שעה?</span>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="chip" />
      </label>
      <p className="text-[var(--fg-soft)]">התזכורת מנוסחת כהזמנה, לא כמשימה. אפשר לשנות הכול בהגדרות.</p>
      <button className="btn-primary mt-auto" onClick={finish}>למדידת הבסיס (5 דקות)</button>
    </Step>
  );
}
