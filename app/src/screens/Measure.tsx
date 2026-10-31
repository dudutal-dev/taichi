// מדידה עצמית מודרכת (שבוע 0/6/12/24): עמידה על רגל אחת, קימה מכיסא ב-30 ש', TUG ביתי 3 מ', לחץ דם, שינה, מצב רוח.
// תמיד אפשר: לחזור צעד, לדלג על מבחן, לשמור מה שיש ולצאת, או לצאת בלי לשמור. לכל מבחן אילוסטרציה של הדמות.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, todayISO, type Measurement } from '../db';
import { contentUrl } from '../content/manifest';
import TopBar from '../components/TopBar';

type Step = 'intro' | 'legL' | 'legR' | 'sts' | 'tug' | 'bp' | 'sleep' | 'done';
const ORDER: Step[] = ['intro', 'legL', 'legR', 'sts', 'tug', 'bp', 'sleep', 'done'];
const TITLES: Record<Step, string> = { intro: 'מדידה', legL: 'עמידה על רגל שמאל', legR: 'עמידה על רגל ימין', sts: 'קימה מכיסא, 30 שניות', tug: 'קום ולך, 3 מטר', bp: 'לחץ דם (אם יש מד)', sleep: 'שינה ומצב רוח', done: 'סיכום' };
const ILLUS: Partial<Record<Step, string>> = { legL: 'illustrations/measure_single_leg.jpg', legR: 'illustrations/measure_single_leg.jpg', sts: 'illustrations/measure_sit_to_stand.jpg', tug: 'illustrations/measure_tug.jpg' };

interface Stopwatch { ms: number; on: boolean; start: () => void; stop: () => void; reset: () => void }
function useStopwatch(): Stopwatch {
  const [ms, setMs] = useState(0); const [on, setOn] = useState(false); const t0 = useRef(0);
  useEffect(() => { if (!on) return; const id = window.setInterval(() => setMs(Date.now() - t0.current), 100); return () => window.clearInterval(id); }, [on]);
  return { ms, on, start: () => { t0.current = Date.now(); setMs(0); setOn(true); }, stop: () => setOn(false), reset: () => { setOn(false); setMs(0); } };
}

function Timer({ sw, max, onDone }: { sw: Stopwatch; max: number; onDone: (sec: number) => void }) {
  return (
    <div className="card p-5 flex flex-col items-center gap-4">
      <div className="text-6xl font-extrabold tabular-nums">{(sw.ms / 1000).toFixed(1)}<span className="text-xl"> ש'</span></div>
      {!sw.on ? <button className="btn-primary" onClick={sw.start}>התחל</button>
        : <button className="btn-stop w-full" onClick={() => { sw.stop(); onDone(Math.min(max, Math.round(sw.ms / 100) / 10)); }}>עצור</button>}
      {sw.ms >= max * 1000 && sw.on && <p>הגעת ל-{max} שניות. אפשר לעצור.</p>}
    </div>
  );
}
function Illustration({ src, alt }: { src?: string; alt: string }) {
  if (!src) return null;
  return <img src={contentUrl(src)} alt={alt} className="w-full rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--cream-deep)]" style={{ aspectRatio: '16 / 9', objectFit: 'cover' }} loading="eager" />;
}
function Row({ k, v, u }: { k: string; v: number | string | undefined; u: string }) {
  return <div className="flex justify-between"><span>{k}</span><span className="font-extrabold tabular-nums">{v ?? '—'} {v !== undefined ? u : ''}</span></div>;
}
function Scale({ label, value, onChange }: { label: string; value?: number; onChange: (v: number) => void }) {
  return (
    <div><div className="font-extrabold mb-2">{label}</div>
      <div className="flex gap-2">{[1, 2, 3, 4, 5].map(v => <button key={v} className="chip flex-1 justify-center" aria-pressed={value === v} onClick={() => onChange(v)}>{v}</button>)}</div>
      <div className="flex justify-between text-[var(--fg-soft)] text-sm mt-1"><span>גרוע</span><span>מצוין</span></div>
    </div>
  );
}

export default function Measure() {
  const nav = useNavigate();
  const week = Number(useParams().week ?? 0) as Measurement['week'];
  const [step, setStep] = useState<Step>('intro');
  const [m, setM] = useState<Partial<Measurement>>({});
  const sw = useStopwatch();
  const [count, setCount] = useState(0);
  const i = ORDER.indexOf(step);
  const next = () => { sw.reset(); setStep(ORDER[i + 1] ?? 'done'); };
  const back = () => { sw.reset(); setStep(ORDER[Math.max(0, i - 1)] ?? 'intro'); };
  const hasAny = Object.values(m).some(v => v !== undefined);

  async function save() {
    await db.measurements.add({ ...m, date: todayISO(), week } as Measurement);
    if (week === 0) { try { new Audio(contentUrl('audio/narration/teacher_w1.mp3')).play(); } catch { /* ללא רשת */ } }
    nav(week === 0 ? '/download' : '/', { replace: true });
  }

  return (
    <section className="flex flex-col gap-5 pb-6 min-h-[70dvh]">
      <TopBar title={week ? `מדידה — שבוע ${week}` : 'מדידת בסיס'} step={step === 'intro' ? undefined : `שלב ${i} מתוך ${ORDER.length - 2} · ${TITLES[step]}`} onBack={i > 0 ? back : undefined} exitLabel={hasAny ? 'יציאה בלי לשמור' : 'יציאה'} />
      {step !== 'intro' && step !== 'done' && <h1 className="text-2xl font-extrabold">{TITLES[step]}</h1>}

      {step === 'intro' && <>
        <h1 className="text-3xl font-extrabold">{week ? `מדידה חוזרת, שבוע ${week}` : 'מדידת בסיס'}</h1>
        <p className="text-xl">חמש דקות, ליד קיר או כיסא. ארבעה מבחנים קצרים ושתי שאלות. המספרים האלה הם הבסיס שאליו נשווה בשבוע 6, 12 ו-24.</p>
        <div className="grid grid-cols-3 gap-2">
          {(['legL', 'sts', 'tug'] as const).map(s => <img key={s} src={contentUrl(ILLUS[s]!)} alt="" className="rounded-xl border border-[var(--line)] aspect-video object-cover" />)}
        </div>
        <p className="text-[var(--fg-soft)]">אין ציון. יש רק "לפני" ו"אחרי". אפשר לדלג על כל מבחן, ולחזור אליו בפעם אחרת.</p>
        <button className="btn-primary mt-auto" onClick={next}>מתחילים</button>
        <button className="btn-secondary" onClick={() => nav('/', { replace: true })}>לא עכשיו</button>
      </>}

      {(step === 'legL' || step === 'legR') && <>
        <Illustration src={ILLUS[step]} alt="עמידה על רגל אחת ליד כיסא" />
        <p>יד קרובה לכיסא או לקיר, בלי לאחוז. מרימים את הרגל השנייה כמה סנטימטרים. עוצרים כשהרגל נוגעת ברצפה או כשנאחזים. עד 60 שניות.</p>
        <Timer sw={sw} max={60} onDone={s => { setM(x => ({ ...x, [step === 'legL' ? 'singleLegL' : 'singleLegR']: s })); next(); }} />
      </>}

      {step === 'sts' && <>
        <Illustration src={ILLUS.sts} alt="קימה מכיסא עם ידיים על החזה" />
        <p>כיסא ללא משענות יד, ידיים על החזה. קמים ויושבים כמה פעמים שאפשר ב-30 שניות. לוחצים ＋ בכל קימה.</p>
        <div className="card p-5 flex flex-col items-center gap-4">
          <div className="text-6xl font-extrabold tabular-nums">{count}</div>
          <div className="text-[var(--fg-soft)]">{Math.max(0, 30 - Math.floor(sw.ms / 1000))} שניות נותרו</div>
          {!sw.on ? <button className="btn-primary" onClick={() => { setCount(0); sw.start(); }}>התחל 30 שניות</button>
            : <button className="btn-primary text-4xl" onClick={() => setCount(c => c + 1)} disabled={sw.ms >= 30000}>＋</button>}
          {sw.ms >= 30000 && <button className="btn-secondary" onClick={() => { setM(x => ({ ...x, sitToStand30: count })); next(); }}>שמור {count}</button>}
        </div>
      </>}

      {step === 'tug' && <>
        <Illustration src={ILLUS.tug} alt="קום ולך שלושה מטר" />
        <p>יושבים בכיסא. בסימן: קמים, הולכים 3 מטר, מסתובבים, חוזרים ויושבים. מודדים את הזמן.</p>
        <Timer sw={sw} max={120} onDone={s => { setM(x => ({ ...x, tug: s })); next(); }} />
      </>}

      {step === 'bp' && <>
        <p className="text-[var(--fg-soft)]">אם אין מד, מדלגים.</p>
        <div className="flex gap-3">
          <label className="flex-1">עליון<input type="number" inputMode="numeric" className="chip w-full mt-1" placeholder="120" onChange={e => setM(x => ({ ...x, bpSys: Number(e.target.value) || undefined }))} /></label>
          <label className="flex-1">תחתון<input type="number" inputMode="numeric" className="chip w-full mt-1" placeholder="80" onChange={e => setM(x => ({ ...x, bpDia: Number(e.target.value) || undefined }))} /></label>
        </div>
        <button className="btn-primary mt-auto" onClick={next}>המשך</button>
      </>}

      {step === 'sleep' && <>
        <Scale label="איך ישנת השבוע?" value={m.sleep1to5} onChange={v => setM(x => ({ ...x, sleep1to5: v }))} />
        <Scale label="מצב הרוח השבוע?" value={m.mood1to5} onChange={v => setM(x => ({ ...x, mood1to5: v }))} />
        <button className="btn-primary mt-auto" onClick={next}>המשך</button>
      </>}

      {step === 'done' && <>
        <h1 className="text-3xl font-extrabold">סיכום</h1>
        <div className="card p-5 flex flex-col gap-1">
          <Row k="רגל שמאל" v={m.singleLegL} u="ש'" /><Row k="רגל ימין" v={m.singleLegR} u="ש'" /><Row k="קימה מכיסא" v={m.sitToStand30} u="חזרות" /><Row k="קום ולך" v={m.tug} u="ש'" />
          {m.bpSys && <Row k="לחץ דם" v={`${m.bpSys}/${m.bpDia ?? ''}`} u="" />}<Row k="שינה" v={m.sleep1to5} u="/5" /><Row k="מצב רוח" v={m.mood1to5} u="/5" />
        </div>
        <p className="text-[var(--fg-soft)]">{week === 0 ? 'זה הבסיס. נחזור אליו בשבוע 6.' : 'ההשוואה לבסיס במסך ההתקדמות.'} מבחן שדילגת עליו מסומן בקו.</p>
        <button className="btn-primary mt-auto" onClick={save}>שמור והמשך</button>
      </>}

      {step !== 'intro' && step !== 'done' && (
        <div className="flex gap-2 mt-auto pt-2">
          <button className="btn-secondary flex-1" onClick={next}>דלג על המבחן הזה</button>
          {hasAny && <button className="btn-secondary flex-1" onClick={() => { sw.reset(); setStep('done'); }}>סיים ושמור מה שיש</button>}
        </div>
      )}
    </section>
  );
}
