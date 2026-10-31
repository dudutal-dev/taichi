// טבעת 150 — הוויזואל המרכזי. על ירוק: מסלול קרם שקוף, קשת ברונזה, מספר קרם. על קרם: מסלול בהיר, קשת במבוק.
interface Props { minutes: number; goal: number; size?: number; days?: boolean[]; onGreen?: boolean }

export default function Ring({ minutes, goal, size = 240, days, onGreen = false }: Props) {
  const r = (size - 22) / 2, c = 2 * Math.PI * r;
  const frac = Math.min(1, minutes / goal);
  const track = onGreen ? 'rgba(246,241,228,.22)' : 'var(--ring-track)';
  const arc = onGreen ? 'var(--color-bronze)' : 'var(--color-bamboo)';
  const fg = onGreen ? 'var(--color-cream)' : 'var(--fg)';
  const soft = onGreen ? 'rgba(246,241,228,.75)' : 'var(--fg-soft)';
  return (
    <div className="flex flex-col items-center gap-4" role="img" aria-label={`${minutes} דקות מתוך ${goal} השבוע`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth="14" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={arc} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - frac)} style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.4,0,.2,1)' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ color: fg }}>
          <div className="font-extrabold leading-none" style={{ fontSize: size * 0.27 }}>{minutes}</div>
          <div className="mt-2" style={{ color: soft }}>דקות מתוך {goal}</div>
        </div>
      </div>
      {days && (
        <div className="flex gap-2.5" aria-label="ימי תרגול השבוע">
          {days.slice(0, 5).map((d, i) => <span key={i} className="w-4 h-4 rounded-full" style={{ background: d ? arc : track }} />)}
        </div>
      )}
    </div>
  );
}
