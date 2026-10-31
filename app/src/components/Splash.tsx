// מסך פתיחה: ירוק-במבוק, הטבעת מציירת את עצמה, השם והמשפט נכנסים ברכות. ~2.2 ש' ואז נעלם. מכבד prefers-reduced-motion.
import { useEffect, useState } from 'react';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const total = reduced() ? 600 : 2300;
    const t1 = window.setTimeout(() => setLeaving(true), total - 500);
    const t2 = window.setTimeout(onDone, total);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [onDone]);
  const S = 260, r = 112, c = 2 * Math.PI * r;
  return (
    <div className={`fixed inset-0 z-[100] grid place-items-center text-[var(--color-cream)] splash ${leaving ? 'splash-leave' : ''}`} style={{ background: 'var(--color-bamboo)' }} aria-hidden onClick={onDone}>
      <svg className="splash-leaves" viewBox="0 0 400 400" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <g fill="var(--color-bamboo-deep)">
          <path d="M330 60c40 10 60 45 48 80-30-10-52-40-48-80z" transform="rotate(-20 350 100)" />
          <path d="M40 330c45-5 80 20 85 55-38 5-72-18-85-55z" transform="rotate(15 80 360)" />
          <path d="M335 300c38 12 56 46 44 78-30-12-50-42-44-78z" transform="rotate(10 355 340)" />
          <path d="M20 40c42 2 70 30 70 62-36-2-64-26-70-62z" transform="rotate(-10 55 70)" />
        </g>
      </svg>
      <div className="relative flex flex-col items-center gap-6">
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={S / 2} cy={S / 2} r={r} fill="none" stroke="rgba(246,241,228,.22)" strokeWidth="16" />
          <circle className="splash-arc" cx={S / 2} cy={S / 2} r={r} fill="none" stroke="var(--color-bronze)" strokeWidth="16" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c} />
        </svg>
        <div className="absolute top-0 left-0 grid place-items-center" style={{ width: S, height: S }}>
          <span className="splash-num font-extrabold" style={{ fontSize: 84, lineHeight: 1 }}>150</span>
        </div>
        <div className="splash-title text-center">
          <div className="text-4xl font-extrabold tracking-tight">טאי צ'י 150</div>
          <div className="mt-2 text-lg text-[var(--color-cream)]/80">150 דקות בשבוע. בקצב שלך.</div>
        </div>
      </div>
      <style>{`
        .splash { animation: splash-in 400ms ease-out both; }
        .splash-leave { animation: splash-out 500ms ease-in both; pointer-events: none; }
        .splash-leaves { position: absolute; inset: 0; opacity: .9; }
        .splash-arc { animation: splash-draw 1400ms cubic-bezier(.4,0,.2,1) 250ms forwards; }
        .splash-num { animation: splash-rise 700ms ease-out 600ms both; }
        .splash-title { animation: splash-rise 700ms ease-out 900ms both; }
        @keyframes splash-draw { to { stroke-dashoffset: ${c * 0.28}; } }
        @keyframes splash-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes splash-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes splash-out { to { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .splash-arc { animation-duration: 1ms; } .splash-num, .splash-title { animation: none; } }
      `}</style>
    </div>
  );
}
