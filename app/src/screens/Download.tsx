// מסך "מוריד תוכן (xxMB)": הורדה מלאה או שלב-שלב (16:9 בלבד / גם 9:16). אפשר לעצור ולהמשיך.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { planDownload, downloadAll, cachedCount, formatMB, type DownloadPlan } from '../lib/offline';

export default function Download() {
  const nav = useNavigate();
  const [plan, setPlan] = useState<DownloadPlan | null>(null);
  const [portrait, setPortrait] = useState(true);
  const [have, setHave] = useState(0);
  const [prog, setProg] = useState<{ done: number; total: number; failed: number } | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => { planDownload(portrait).then(async p => { setPlan(p); setHave(await cachedCount(p.urls)); }); }, [portrait]);

  async function start() {
    if (!plan) return;
    abort.current = new AbortController();
    setProg({ done: 0, total: plan.urls.length, failed: 0 });
    const r = await downloadAll(plan.urls, (done, total, failed) => setProg({ done, total, failed }), abort.current.signal);
    setHave(await cachedCount(plan.urls));
    if (r.failed === 0 && r.done === plan.urls.length) setTimeout(() => nav('/'), 800);
  }

  const pct = prog ? Math.round((prog.done / prog.total) * 100) : plan ? Math.round((have / plan.urls.length) * 100) : 0;
  return (
    <section className="flex flex-col gap-5 pt-4 min-h-[70dvh]">
      <h1 className="text-3xl font-extrabold">תוכן ללא רשת</h1>
      <p className="text-xl">אחרי ההורדה הכול עובד גם בלי אינטרנט: הווידאו, הקריינות והמוזיקה.</p>
      {plan && <p className="text-[var(--fg-soft)]">{plan.urls.length} קבצים, כ-{formatMB(plan.bytes)}. במכשיר כבר {have}.</p>}
      <button className="chip w-full justify-between" aria-pressed={portrait} onClick={() => setPortrait(p => !p)}><span>גם גרסה לטלפון בפורטרט (9:16)</span><span>{portrait ? 'כן' : 'לא'}</span></button>
      <div className="card p-5">
        <div className="h-4 rounded-full bg-[var(--ring-track)] overflow-hidden"><div className="h-full bg-[var(--color-bamboo)] transition-[width] duration-500" style={{ width: `${pct}%` }} /></div>
        <div className="mt-2 flex justify-between text-[var(--fg-soft)]"><span>{pct}%</span>{prog && <span>{prog.done}/{prog.total}{prog.failed ? ` · ${prog.failed} נכשלו` : ''}</span>}</div>
      </div>
      {!prog || prog.done === prog.total
        ? <button className="btn-primary mt-auto" onClick={start} disabled={!plan}>{have && plan && have >= plan.urls.length ? 'הכול כבר במכשיר' : 'הורד הכול עכשיו'}</button>
        : <button className="btn-stop w-full mt-auto" onClick={() => abort.current?.abort()}>עצור (אפשר להמשיך אחר כך)</button>}
      <button className="btn-secondary" onClick={() => nav('/')}>אחר כך</button>
    </section>
  );
}
