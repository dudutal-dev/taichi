// ההתקדמות: דקות שבועיות ב-12 שבועות (עמודות, גוון אחד, קו יעד 150), מדידות 0/6/12/24 בהשוואה, שבועות ירוקים ברצף, יומן כאב. טון תיאורי.
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getProfile, todayISO, type Profile } from '../db';
import { summarizeWeek, weekNumber, greenStreak, WEEKLY_GOAL_MIN } from '../lib/week';

export default function Progress() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => { getProfile().then(setProfile); }, []);
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? [];
  const measurements = useLiveQuery(() => db.measurements.orderBy('week').toArray(), []) ?? [];
  if (!profile) return null;
  const current = weekNumber(profile.startDate, todayISO());
  const weeks = Array.from({ length: 12 }, (_, i) => summarizeWeek(sessions, profile.startDate, i + 1));
  const streak = greenStreak(sessions, profile.startDate, current);
  const pain = sessions.filter(s => s.painKnee || s.painBack || s.dizzy).slice(-10).reverse();

  return (
    <section className="flex flex-col gap-5 pt-2">
      <h1 className="text-3xl font-extrabold">ההתקדמות</h1>
      <div className="card p-5">
        <div className="text-4xl font-extrabold">{streak} <span className="text-lg font-semibold text-[var(--fg-soft)]">שבועות ירוקים ברצף</span></div>
        <p className="text-[var(--fg-soft)] mt-1">שבוע ירוק: שלושה מפגשים לפחות. יום שפוספס לא מאפס כלום.</p>
      </div>
      <MinutesChart weeks={weeks} current={current} />
      <Measurements rows={measurements} current={current} />
      {pain.length > 0 && (
        <div className="card p-5">
          <h2 className="font-extrabold text-lg">יומן כאב</h2>
          <ul className="mt-2 flex flex-col gap-1">{pain.map(s => <li key={s.id} className="flex justify-between"><span>{s.date}</span><span>{[s.painKnee && 'ברך', s.painBack && 'גב', s.dizzy && 'סחרחורת'].filter(Boolean).join(', ')}</span></li>)}</ul>
        </div>
      )}
    </section>
  );
}

function MinutesChart({ weeks, current }: { weeks: ReturnType<typeof summarizeWeek>[]; current: number }) {
  const W = 480, H = 220, padL = 36, padB = 28, padT = 16;
  const max = Math.max(WEEKLY_GOAL_MIN, ...weeks.map(w => w.minutes)) * 1.1;
  const x = (i: number) => padL + (i * (W - padL - 8)) / 12;
  const bw = (W - padL - 8) / 12 - 6;
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max);
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="card p-5">
      <h2 className="font-extrabold text-lg">דקות בשבוע</h2>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-2" role="img" aria-label="דקות תרגול בכל אחד מ-12 השבועות, מול יעד של 150">
        <line x1={padL} x2={W - 8} y1={y(WEEKLY_GOAL_MIN)} y2={y(WEEKLY_GOAL_MIN)} stroke="var(--color-bronze)" strokeWidth="2" strokeDasharray="6 6" />
        <text x={W - 8} y={y(WEEKLY_GOAL_MIN) - 6} textAnchor="end" fontSize="13" fill="var(--fg-soft)">יעד 150</text>
        <line x1={padL} x2={W - 8} y1={y(0)} y2={y(0)} stroke="var(--line)" strokeWidth="1" />
        {weeks.map((w, i) => (
          <g key={w.week} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
            <rect x={x(i)} y={padT} width={bw + 6} height={H - padT - padB} fill="transparent" />
            <rect x={x(i)} y={y(w.minutes)} width={bw} height={Math.max(0, y(0) - y(w.minutes))} rx="4"
              fill={w.week === current ? 'var(--color-bamboo)' : w.week < current ? 'var(--color-bamboo-soft)' : 'var(--ring-track)'} />
            {(hover === i || w.week === current) && w.minutes > 0 && <text x={x(i) + bw / 2} y={y(w.minutes) - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--fg)">{w.minutes}</text>}
            <text x={x(i) + bw / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--fg-soft)">{w.week}</text>
          </g>
        ))}
      </svg>
      <p className="text-[var(--fg-soft)] text-sm">עמודה כהה: השבוע הנוכחי. קו מקווקו: 150 דקות.</p>
    </div>
  );
}

const METRICS: { key: 'singleLegL' | 'singleLegR' | 'sitToStand30' | 'tug' | 'sleep1to5' | 'mood1to5'; label: string; unit: string; better: 'up' | 'down' }[] = [
  { key: 'singleLegL', label: 'עמידה על רגל שמאל', unit: 'ש\'', better: 'up' },
  { key: 'singleLegR', label: 'עמידה על רגל ימין', unit: 'ש\'', better: 'up' },
  { key: 'sitToStand30', label: 'קימה מכיסא ב-30 ש\'', unit: 'חזרות', better: 'up' },
  { key: 'tug', label: 'קום ולך 3 מ\'', unit: 'ש\'', better: 'down' },
  { key: 'sleep1to5', label: 'שינה', unit: '/5', better: 'up' },
  { key: 'mood1to5', label: 'מצב רוח', unit: '/5', better: 'up' },
];

function Measurements({ rows, current }: { rows: import('../db').Measurement[]; current: number }) {
  if (rows.length === 0) return <div className="card p-5"><h2 className="font-extrabold text-lg">מדידות</h2><p className="text-[var(--fg-soft)] mt-1">עדיין אין מדידת בסיס.</p></div>;
  const byWeek = new Map(rows.map(r => [r.week, r]));
  const weeksPresent = [0, 6, 12, 24].filter(w => byWeek.has(w as 0));
  const shade = ['var(--ring-track)', 'var(--color-bamboo-soft)', 'var(--color-bamboo)', 'var(--color-bamboo-deep)'];
  return (
    <div className="card p-5">
      <h2 className="font-extrabold text-lg">מדידות: בסיס מול שבוע 6, 12, 24</h2>
      <table className="w-full mt-3 text-start">
        <thead><tr className="text-[var(--fg-soft)] text-sm"><th className="text-start font-semibold">מדד</th>{weeksPresent.map(w => <th key={w} className="font-semibold">{w === 0 ? 'בסיס' : `שבוע ${w}`}</th>)}</tr></thead>
        <tbody>
          {METRICS.map(mt => {
            const vals = weeksPresent.map(w => byWeek.get(w as 0)?.[mt.key]);
            const max = Math.max(1, ...vals.map(v => v ?? 0));
            return (
              <tr key={mt.key} className="border-t border-[var(--line)]">
                <td className="py-2 pe-2">{mt.label}<div className="text-[var(--fg-soft)] text-sm">{mt.unit}{mt.better === 'down' ? ' · פחות = טוב יותר' : ''}</div></td>
                {vals.map((v, i) => (
                  <td key={i} className="py-2 text-center align-bottom">
                    <div className="mx-auto w-7 rounded-t-[4px]" style={{ height: `${v ? Math.max(6, (v / max) * 48) : 0}px`, background: shade[i] }} aria-hidden />
                    <div className="font-extrabold tabular-nums">{v ?? '—'}</div>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {current >= 6 && !byWeek.has(6) && <p className="mt-3"><a href="#/measure/6" className="underline font-extrabold">למדידת שבוע 6</a></p>}
    </div>
  );
}
