// מדידה עצמית מודרכת (שבוע 0/6/12/24): עמידה על רגל אחת (ש', כל רגל, ליד קיר), קימה מכיסא ב-30 ש', TUG ביתי 3 מ', לחץ דם, שינה, מצב רוח.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, todayISO, type Measurement } from '../db';
import { contentUrl } from '../content/manifest';

type Step = 'intro' | 'legL' | 'legR' | 'sts' | 'tug' | 'bp' | 'sleep' | 'done';
const ORDER: Step[] = ['intro', 'legL', 'legR', 'sts', 'tug', 'bp', 'sleep', 'done'];

function useStopwatch() {
  const [ms, setMs] = useState(0); const [on, setOn] = useState(false); const t0 = useRef(0);
  useEffect(() => { if (!on) return; const id = window.setInterval(() => setMs(Date.now() - t0.current), 100); return () => window.clearInterval(id); }, [on]);
  return { ms, on, start: () => { t0.current = Date.now(); setMs(0); setOn(true); }, stop: () => setOn(false), reset: () => { setOn(false); setMs(0); } };
}

export default function Measure() {
  const nav = useNavigate();
  const week = Number(useParams().week ?? 0) as Measurement['week'];
  const [step, setStep] = useState<Step>('intro');
  const [m, setM] = useState<Partial<Measurement>>({});
  const sw = useStopwatch();
  const [count, setCount] = useState(0);
  const next = () => { sw.reset(); setStep(ORDER[ORDER.indexOf(step) + 1] ?? 'done'); };

  async function save() {
    await db.measurements.add({ ...m, date: todayISO(), week } as Measurement);
    if (week === 0) { try { new Audio(contentUrl('audio/narration/teacher_w1.mp3')).play(); } catch { /* ללא רשת */ } }
    nav(week === 0 ? '/download' : '/', { replace: true }); // אחרי מדידת הבסיס: הצעה להוריד את התוכן למכשיר
  }

  const Timer = ({ onDone, max }: { onDone: (sec: number) => void; max: number }) => (
    <div className="card p-5 flex flex-col items-center gap-4">
      <div className="text-6xl font-extrabold tabular-nums">{(sw.ms / 1000).toFixed(1)}<span className="text-xl"> ש'</span></div>
      {!sw.on ? <button className="btn-primary" onClick={sw.start}>התחל</button>
        : <button className="btn-stop w-full" onClick={() => { sw.stop(); onDone(Math.min(max, Math.round(sw.ms / 100) / 10)); }}>עצור</button>}
      {sw.ms >= max * 1000 && sw.on && <p>הגעת ל-{max} שניות. אפשר לעצור.</p>}
    </div>
  );

  const titles: Record<Step, string> = { intro: `מדידת בסיס${week ? ` — שבוע ${week}` : ''}`, legL: 'עמידה על רגל שמאל', legR: 'עמידה על רגל ימין', sts: 'קימה מכיסא, 30 שניות', tug: 'קום ולך, 3 מטר', bp: 'לחץ דם (אם יש מד)', sleep: 'שינה ומצב רוח', done: 'נשמר' };

  return (
    <section className="flex flex-col gap-5 pt-4 min-h-[70dvh]">
      <h1 className="text-3xl font-extrabold">{titles[step]}</h1>
      {step === 'intro' && <>
        <p className="text-xl">חמש דקות, ליד קיר או כיסא. המספרים האלה הם הבסיס שאליו נשווה בשבוע 6, 12 ו-24. זה הרגע שבו רואים שזה עובד.</p>
        <p className="text-[var(--fg-soft)]">אין ציון. יש רק "לפני" ו"אחרי".</p>
        <button className="btn-primary mt-auto" onClick={next}>מתחילים</button>
      </>}
      {(step === 'legL' || step === 'legR') && <>
        <p>יד קרובה לקיר. מרימים את הרגל השנייה כמה סנטימטרים. עוצרים כשהרגל נוגעת ברצפה או כשנוגעים בקיר. עד 60 שניות.</p>
        <Timer max={60} onDone={s => { setM(x => ({ ...x, [step === 'legL' ? 'singleLegL' : 'singleLegR']: s })); next(); }} />
      </>}
      {step === 'sts' && <>
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
        <p>יושבים בכיסא. בסימן: קמים, הולכים 3 מטר, מסתובבים, חוזרים ויושבים. מודדים את הזמן.</p>
        <Timer max={120} onDone={s => { setM(x => ({ ...x, tug: s })); next(); }} />
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
        <div className="card p-5 flex flex-col gap-1">
          <Row k="רגל שמאל" v={m.singleLegL} u="ש'" /><Row k="רגל ימין" v={m.singleLegR} u="ש'" /><Row k="קימה מכיסא" v={m.sitToStand30} u="חזרות" /><Row k="קום ולך" v={m.tug} u="ש'" />
          {m.bpSys && <Row k="לחץ דם" v={`${m.bpSys}/${m.bpDia ?? ''}`} u="" />}<Row k="שינה" v={m.sleep1to5} u="/5" /><Row k="מצב רוח" v={m.mood1to5} u="/5" />
        </div>
        <p className="text-[var(--fg-soft)]">{week === 0 ? 'זה הבסיס. נחזור אליו בשבוע 6.' : 'ההשוואה לבסיס במסך ההתקדמות.'}</p>
        <button className="btn-primary mt-auto" onClick={save}>שמור והמשך</button>
      </>}
    </section>
  );
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
