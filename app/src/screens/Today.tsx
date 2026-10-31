// מסך הבית "היום": כרטיס במבוק ירוק עם טבעת 150 ונקודות ימים; כרטיס המפגש הבא עם תצוגה מקדימה של התנועה; רשת ביטחון; הליכות/כוח.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import Ring from '../components/Ring';
import { db, getProfile, todayISO, type Profile } from '../db';
import { summarizeWeek, weekNumber, greenStreak, WEEKLY_GOAL_MIN } from '../lib/week';
import { weekPlan } from '../content/plan';
import { contentUrl, loadManifest, movementOf, type Manifest } from '../content/manifest';
import { softNudge } from '../lib/adapt';

const GREETING = () => { const h = new Date().getHours(); return h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : h < 21 ? 'ערב טוב' : 'לילה טוב'; };

export default function Today() {
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  useEffect(() => { getProfile().then(setProfile); loadManifest().then(setManifest).catch(() => setManifest(null)); }, []);

  const today = todayISO();
  const week = profile ? weekNumber(profile.startDate, today) : 1;
  const sessions = useLiveQuery(() => db.sessions.where('week').equals(week).toArray(), [week]) ?? [];
  const allSessions = useLiveQuery(() => db.sessions.toArray(), []) ?? [];
  const lastSession = useLiveQuery(() => db.sessions.orderBy('date').last(), []);
  const weekRow = useLiveQuery(() => db.weeks.get(week), [week]);
  const summary = profile ? summarizeWeek(sessions, profile.startDate, week) : null;
  const streak = profile ? greenStreak(allSessions, profile.startDate, week) : 0;
  const plan = weekPlan(week);
  const sessionNo = (summary?.sessions ?? 0) + 1;
  const names = plan.core.map(d => (manifest ? movementOf(manifest, d.id)?.nameHe : null) ?? d.id);
  const nudge = softNudge(lastSession?.date ?? null, today);
  const plannedMin = profile?.maxSessionMinWeeks1to4 && week <= 4 ? Math.min(plan.plannedMin, profile.maxSessionMinWeeks1to4) : plan.plannedMin;
  const balanceSuspended = !!profile?.suspendBalanceUntil && profile.suspendBalanceUntil > today;
  const measureDue = (week >= 6 && week < 12) ? 6 : week >= 12 ? 12 : null;
  const measurementsDone = useLiveQuery(() => db.measurements.toArray(), []) ?? [];
  const needMeasure = measureDue !== null && !measurementsDone.some(m => m.week === measureDue);
  // תצוגה מקדימה: הקליף המאושר הראשון של התנועה החדשה ביותר בשבוע
  const previewMv = manifest ? [...plan.core].reverse().map(d => movementOf(manifest, d.id)).find(mv => mv?.clips.some(c => c.qa === 'approved' && c.url)) : undefined;
  const preview = previewMv?.clips.find(c => c.qa === 'approved' && c.url && c.view === 'front') ?? previewMv?.clips.find(c => c.qa === 'approved' && c.url);

  async function bump(field: 'walks' | 'strength') {
    const row = (await db.weeks.get(week)) ?? { weekNo: week, startDate: profile?.startDate ?? today, walks: 0, strength: 0 };
    await db.weeks.put({ ...row, [field]: Math.min(7, row[field] + 1) });
  }

  return (
    <section className="flex flex-col gap-5">
      <header className="flex items-center justify-between pt-1">
        <div>
          <div className="text-[var(--fg-soft)]">{GREETING()}</div>
          <h1 className="text-2xl font-extrabold leading-tight">טאי צ'י 150</h1>
        </div>
        <Link to="/settings" className="chip !min-h-11" aria-label="הגדרות">הגדרות</Link>
      </header>

      {/* כרטיס השבוע: במבוק, טבעת קרם/ברונזה */}
      <article className="rounded-[28px] p-5 text-[var(--color-cream)] relative overflow-hidden" style={{ background: 'linear-gradient(160deg, var(--color-bamboo) 0%, var(--color-bamboo-deep) 100%)' }}>
        <svg className="absolute -left-10 -bottom-10 w-48 h-48 opacity-20" viewBox="0 0 200 200" aria-hidden><path d="M20 180C60 100 120 60 190 40c-20 70-70 120-170 140z" fill="var(--color-cream)" /></svg>
        <div className="relative flex flex-col items-center">
          <div className="self-start flex items-baseline gap-2">
            <span className="font-extrabold text-lg">שבוע {week}</span>
            <span className="text-[var(--color-cream)]/75">· {plan.stage}</span>
            {streak > 0 && <span className="ms-auto text-sm bg-[var(--color-cream)]/15 rounded-full px-2.5 py-0.5">{streak} שבועות ירוקים</span>}
          </div>
          <div className="mt-3"><Ring minutes={summary?.minutes ?? 0} goal={WEEKLY_GOAL_MIN} days={summary?.days} size={210} onGreen /></div>
          <p className="mt-3 text-[var(--color-cream)]/80 text-center text-sm">{plan.evidence}</p>
        </div>
      </article>

      {nudge && <p className="card p-4 text-center">{nudge}</p>}
      {needMeasure && <Link to={`/measure/${measureDue}`} className="card p-4 border-[var(--color-bronze)] block"><span className="font-extrabold">שבוע {measureDue}: </span>זמן למדידה חוזרת. חמש דקות, ואז רואים את ההבדל מהבסיס.</Link>}

      {/* המפגש הבא */}
      <article className="card overflow-hidden">
        <div className="flex">
          <div className="p-5 flex-1 min-w-0">
            <div className="text-[var(--fg-soft)]">מפגש {Math.min(5, sessionNo)} · {plannedMin} דק'</div>
            <h2 className="text-xl font-extrabold mt-1 leading-tight">{profile?.suggestSeatedNext ? 'מפגש ישיבה (אחרי כאב ברך)' : names.join(' · ')}</h2>
            {(profile?.nearChair || balanceSuspended) && <p className="mt-2 text-[var(--color-wood)] font-semibold text-sm">היום ליד כיסא או קיר.{balanceSuspended ? ' תנועות שיווי המשקל מושהות השבוע.' : ''}</p>}
          </div>
          {preview?.url && (
            <video src={contentUrl(preview.url)} muted playsInline loop autoPlay preload="metadata" className="w-[128px] shrink-0 object-cover bg-[var(--cream-deep)]" style={{ transform: 'scaleX(-1)' }} aria-hidden />
          )}
        </div>
        <div className="p-4 pt-0 flex flex-col gap-3">
          <button className="btn-primary" onClick={() => nav(`/session/${week}`)} disabled={!manifest}>{manifest ? 'התחל' : 'טוען תוכן…'}</button>
          <button className="btn-secondary" onClick={() => nav(`/session/${week}?short=1`)} disabled={!manifest}>אין לי זמן? 10 דקות</button>
        </div>
      </article>

      <article className="card p-5">
        <h3 className="font-extrabold text-lg">השבוע, מחוץ לאפליקציה</h3>
        <p className="text-[var(--fg-soft)] mt-1 text-sm">טאי צ'י הוא מרכיב שיווי המשקל. לצדו: 2 הליכות מהירות ו-2 אימוני כוח. רק מסמנים.</p>
        <div className="flex gap-3 mt-4">
          <button className="chip flex-1 justify-center" onClick={() => bump('walks')}>הליכות {weekRow?.walks ?? 0}/2 ＋</button>
          <button className="chip flex-1 justify-center" onClick={() => bump('strength')}>כוח {weekRow?.strength ?? 0}/2 ＋</button>
        </div>
      </article>
    </section>
  );
}
