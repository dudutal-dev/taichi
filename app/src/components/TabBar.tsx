// סרגל טאבים תחתון כמו באפליקציה: אייקון + תווית ממורכזים, מצב פעיל מודגש, גובה 72px + שוליים בטוחים.
import { NavLink } from 'react-router-dom';

const ICONS: Record<string, (active: boolean) => React.ReactNode> = {
  today: a => <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={a ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2" /><path d="M12 8.5a3.5 3.5 0 0 1 0 7" fill={a ? 'currentColor' : 'none'} /></svg>,
  plan: a => <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={a ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v16M6 6h9l-2 3 2 3H6" fill={a ? 'currentColor' : 'none'} /><path d="M12 20h6" /></svg>,
  progress: a => <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={a ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /><path d="M4 10h2v10H4zM10 4h2v16h-2zM16 12h2v8h-2z" fill={a ? 'currentColor' : 'none'} stroke="none" /></svg>,
  library: a => <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={a ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M10 9l5 3-5 3z" fill={a ? 'currentColor' : 'none'} /></svg>,
};

const TABS = [
  { to: '/', id: 'today', label: 'היום' },
  { to: '/plan', id: 'plan', label: 'התוכנית' },
  { to: '/progress', id: 'progress', label: 'ההתקדמות' },
  { to: '/library', id: 'library', label: 'הספרייה' },
];

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--line)] bg-[var(--bg-elev)]/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="ניווט ראשי">
      <ul className="flex max-w-[520px] mx-auto">
        {TABS.map(t => (
          <li key={t.to} className="flex-1">
            <NavLink to={t.to} end={t.to === '/'} className={({ isActive }) => `flex flex-col items-center justify-center gap-1 min-h-[72px] text-[0.8rem] font-semibold transition-colors ${isActive ? 'text-[var(--color-bamboo)]' : 'text-[var(--fg-soft)]'}`}>
              {({ isActive }) => (
                <>
                  <span className={`grid place-items-center w-14 h-8 rounded-full transition-colors ${isActive ? 'bg-[var(--color-bamboo)]/14' : ''}`}>{ICONS[t.id]!(isActive)}</span>
                  <span>{t.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
