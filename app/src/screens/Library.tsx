// ספריית התנועות: רשת כרטיסים; לכל תנועה וידאו חזיתי/צד, לולאה, הילוך איטי, 3 נקודות טכניקה, אזהרת ברך, טעות נפוצה.
// "רק לחזור על תנועה אחת" = 3 דקות שנספרות.
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { contentUrl, loadManifest, type Manifest, type ManifestMovement } from '../content/manifest';
import { db, getProfile, todayISO } from '../db';
import { weekNumber, dayInWeek } from '../lib/week';

const MISTAKES: Record<string, string> = {
  opening: 'הכתפיים עולות עם הידיים. הן נשארות למטה.',
  cloud_hands: 'היד מובילה והמשקל נגרר. קודם המשקל, אחר כך היד.',
  grasp_bird_tail: 'הצעד גדול מדי והברך עוברת את כף הרגל. חצי כף רגל מספיק.',
  cross_hands: 'המרפקים נעולים. הם רכים, מתחת לפרקי הידיים.',
  brush_knee: 'הגב נשען קדימה בדחיפה. הגב אנכי, הדחיפה מהרגליים.',
  closing: 'ממהרים לסיים. הידיים יורדות בקצב הנשיפה.',
  warmup: 'מדלגים. בשבועות 1–4 החימום הוא חלק מהמפגש.',
};
const KNEE: Record<string, string> = { low: 'עומס ברך נמוך', 'low-medium': 'עומס ברך נמוך עד בינוני: צעד קטן, עמידה גבוהה', medium: 'עומס ברך בינוני: הברך מעל כף הרגל, לא לפניה', high: 'עומס ברך גבוה: עמידה גבוהה בלבד' };

export default function Library() {
  const [m, setM] = useState<Manifest | null>(null);
  useEffect(() => { loadManifest().then(setM); }, []);
  const { id } = useParams();
  if (!m) return null;
  if (id) { const mv = m.movements.find(x => x.id === id); return mv ? <MovementDetail m={m} mv={mv} /> : <p>התנועה לא נמצאה.</p>; }
  const list = m.movements.filter(mv => mv.clips.some(c => c.qa === 'approved'));
  return (
    <section className="flex flex-col gap-4 pt-2">
      <h1 className="text-3xl font-extrabold">ספריית התנועות</h1>
      <p className="text-[var(--fg-soft)]">לחזור על תנועה אחת, גם מחוץ למפגש. שלוש דקות שנספרות.</p>
      <ul className="grid grid-cols-2 gap-3">
        {list.map(mv => {
          const c = mv.clips.find(x => x.qa === 'approved' && x.url);
          return (
            <li key={mv.id}>
              <Link to={`/library/${mv.id}`} className="card block overflow-hidden focus-visible:outline-3">
                {c?.url && <video src={contentUrl(c.url)} muted playsInline preload="metadata" className="w-full aspect-video object-cover bg-[var(--cream-deep)]" />}
                <div className="p-3">
                  <div className="font-extrabold">{mv.nameHe}</div>
                  <div className="text-[var(--fg-soft)] text-sm">{mv.pinyin || `שבוע ${mv.minWeek}`}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MovementDetail({ m, mv }: { m: Manifest; mv: ManifestMovement }) {
  const nav = useNavigate();
  const clips = mv.clips.filter(c => c.qa === 'approved' && c.url);
  const [i, setI] = useState(0);
  const [slow, setSlow] = useState(false);
  const [mirror, setMirror] = useState(true);
  const v = useRef<HTMLVideoElement>(null);
  const started = useRef(Date.now());
  useEffect(() => { if (v.current) v.current.playbackRate = slow ? 0.5 : 1; }, [slow, i]);
  const clip = clips[i];
  const tips = mv.tips?.length ? mv.tips : ['גב זקוף', 'ברך מעל כף הרגל', 'נשימה איטית'];

  async function logPractice() {
    const p = await getProfile(); if (!p) return;
    const minutes = Math.max(1, Math.min(10, Math.round((Date.now() - started.current) / 60000)));
    const date = todayISO();
    await db.sessions.add({ date, week: weekNumber(p.startDate, date), dayInWeek: dayInWeek(p.startDate, date), track: p.track, plannedMin: 3, actualMin: Math.max(3, minutes), status: 'partial', movements: [mv.id], painKnee: false, painBack: false, dizzy: false, mood: null, notes: 'ספרייה' });
    nav('/');
  }

  return (
    <section className="flex flex-col gap-4 pt-2">
      <Link to="/library" className="text-[var(--fg-soft)]">→ הספרייה</Link>
      <h1 className="text-3xl font-extrabold">{mv.nameHe}</h1>
      {mv.pinyin && <p className="text-[var(--fg-soft)] -mt-3">{mv.pinyin}</p>}
      {clip?.url ? (
        <video key={clip.id} ref={v} src={contentUrl(clip.url)} loop autoPlay muted playsInline className="w-full rounded-[var(--radius-card)] bg-black" style={{ transform: mirror ? 'scaleX(-1)' : undefined }} />
      ) : <p>אין וידאו מאושר לתנועה הזו עדיין.</p>}
      <div className="flex flex-wrap gap-2">
        {clips.map((c, k) => <button key={c.id} className="chip" aria-pressed={k === i} onClick={() => setI(k)}>{c.view === 'side' ? 'צד' : 'חזית'} {clips.filter(x => x.view === c.view).indexOf(c) + 1}</button>)}
        <button className="chip" aria-pressed={slow} onClick={() => setSlow(s => !s)}>הילוך איטי</button>
        <button className="chip" aria-pressed={mirror} onClick={() => setMirror(x => !x)}>מראה</button>
      </div>
      <div className="card p-4">
        <h2 className="font-extrabold">שלוש נקודות</h2>
        <ol className="list-decimal ps-5 mt-1">{tips.slice(0, 3).map(t => <li key={t}>{t}</li>)}</ol>
      </div>
      <div className="card p-4 border-[var(--color-bronze)]"><span className="font-extrabold">ברך: </span>{KNEE[mv.kneeLoad] ?? mv.kneeLoad}</div>
      <div className="card p-4"><span className="font-extrabold">טעות נפוצה: </span>{MISTAKES[mv.id] ?? 'למהר. הכול איטי יותר ממה שנדמה.'}</div>
      {mv.narration.length > 0 && (
        <button className="btn-secondary" onClick={() => { const n = mv.narration[0]; if (n) new Audio(contentUrl(n.url)).play(); }}>השמע הנחיה</button>
      )}
      <button className="btn-primary" onClick={logPractice}>סיימתי לחזור על התנועה (נספר)</button>
      <div className="h-2" />
      {m.version && <p className="text-[var(--fg-soft)] text-sm">תוכן גרסה {m.version}</p>}
    </section>
  );
}
