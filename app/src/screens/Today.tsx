// מסך הבית "היום": טבעת 150 + 5 נקודות ימים, כרטיס המפגש הבא עם כפתור התחל, רשת ביטחון 10 דק', הליכות/כוח. שום דבר אחר.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import Ring from '../components/Ring';
import { db, ensureProfile, todayISO, type Profile } from '../db';
import { summarizeWeek, weekNumber, WEEKLY_GOAL_MIN } from '../lib/week';
import { weekPlan } from '../content/plan';
import { loadManifest, movementOf, type Manifest } from '../content/manifest';

export default function Today() {
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  useEffect(() => { ensureProfile().then(setProfile); loadManifest().then(setManifest).catch(() => setManifest(null)); }, []);

  const today = todayISO();
  const week = profile ? weekNumber(profile.startDate, today) : 1;
  const sessions = useLiveQuery(() => db.sessions.where('week').equals(week).toArray(), [week]) ?? [];
  const weekRow = useLiveQuery(() => db.weeks.get(week), [week]);
  const summary = profile ? summarizeWeek(sessions, profile.startDate, week) : null;
  const plan = weekPlan(week);
  const sessionNo = (summary?.sessions ?? 0) + 1;
  const names = plan.core.map(d => (manifest ? movementOf(manifest, d.id)?.nameHe : null) ?? d.id).join(' + ');

  async function bump(field: 'walks' | 'strength') {
    const row = (await db.weeks.get(week)) ?? { weekNo: week, startDate: profile?.startDate ?? today, walks: 0, strength: 0 };
    await db.weeks.put({ ...row, [field]: Math.min(7, row[field] + 1) });
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-extrabold">טאי צ'י 150</h1>
        <Link to="/settings" className="chip" aria-label="הגדרות">הגדרות</Link>
      </header>

      <Ring minutes={summary?.minutes ?? 0} goal={WEEKLY_GOAL_MIN} days={summary?.days} />

      <article className="card p-5 flex flex-col gap-4">
        <div>
          <div className="text-[var(--fg-soft)]">שבוע {week}, מפגש {Math.min(5, sessionNo)} · {plan.plannedMin} דק'</div>
          <h2 className="text-2xl font-extrabold mt-1">{names}</h2>
          <p className="text-[var(--fg-soft)] mt-1">{plan.stage} · {plan.evidence}</p>
        </div>
        <button className="btn-primary" onClick={() => nav(`/session/${week}`)} disabled={!manifest}>
          {manifest ? 'התחל' : 'טוען תוכן…'}
        </button>
        <button className="btn-secondary" onClick={() => nav(`/session/${week}?short=1`)} disabled={!manifest}>אין לי זמן? 10 דקות</button>
      </article>

      <article className="card p-5">
        <h3 className="font-extrabold text-lg">השבוע, מחוץ לאפליקציה</h3>
        <p className="text-[var(--fg-soft)] mt-1">טאי צ'י הוא מרכיב שיווי המשקל. לצדו: 2 הליכות מהירות ו-2 אימוני כוח. רק מסמנים.</p>
        <div className="flex gap-3 mt-4">
          <button className="chip flex-1 justify-center" onClick={() => bump('walks')}>הליכות {weekRow?.walks ?? 0}/2 ＋</button>
          <button className="chip flex-1 justify-center" onClick={() => bump('strength')}>כוח {weekRow?.strength ?? 0}/2 ＋</button>
        </div>
      </article>
    </section>
  );
}
