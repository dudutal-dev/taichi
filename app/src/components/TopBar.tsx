// פס עליון למסכים ללא ניווט תחתון (פתיחה, מדידה, הורדה): תמיד אפשר לחזור צעד או לצאת.
import { useNavigate } from 'react-router-dom';

interface Props { title: string; onBack?: () => void; backLabel?: string; exitTo?: string; exitLabel?: string; step?: string }

export default function TopBar({ title, onBack, backLabel = 'חזרה', exitTo = '/', exitLabel = 'יציאה', step }: Props) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-[var(--bg)]/95 backdrop-blur border-b border-[var(--line)] flex items-center justify-between gap-2" style={{ paddingTop: 'calc(env(safe-area-inset-top) + .5rem)' }}>
      <div className="flex items-center gap-2">
        {onBack ? <button className="chip !min-h-11 !px-3" onClick={onBack} aria-label={backLabel}>→ {backLabel}</button> : <span className="w-2" />}
      </div>
      <div className="text-center min-w-0">
        <div className="font-extrabold truncate">{title}</div>
        {step && <div className="text-[var(--fg-soft)] text-sm">{step}</div>}
      </div>
      <button className="chip !min-h-11 !px-3" onClick={() => nav(exitTo, { replace: true })} aria-label={exitLabel}>{exitLabel}</button>
    </header>
  );
}
