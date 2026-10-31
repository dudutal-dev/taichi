import { useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Today from './screens/Today';
import Player from './screens/Player';
import Finish from './screens/Finish';
import Placeholder from './screens/Placeholder';
import { ensureProfile, getSettings } from './db';

const TABS = [
  { to: '/', label: 'היום' },
  { to: '/plan', label: 'התוכנית' },
  { to: '/progress', label: 'ההתקדמות' },
  { to: '/library', label: 'הספרייה' },
];

export default function App() {
  const loc = useLocation();
  const fullscreen = loc.pathname.startsWith('/session');
  useEffect(() => {
    ensureProfile();
    getSettings().then(s => {
      document.documentElement.dataset.font = s.fontScale;
      if (s.darkMode !== 'auto') document.documentElement.dataset.theme = s.darkMode; else delete document.documentElement.dataset.theme;
    });
  }, []);
  return (
    <div className="min-h-dvh flex flex-col">
      <main className={fullscreen ? 'flex-1' : 'flex-1 w-full max-w-[520px] mx-auto px-4 pb-28 pt-4'}>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/session/:week" element={<Player />} />
          <Route path="/finish" element={<Finish />} />
          <Route path="/plan" element={<Placeholder title="התוכנית" text="12 השבועות כמסלול אנכי — נבנה בשלב 6." />} />
          <Route path="/progress" element={<Placeholder title="ההתקדמות" text="גרפים ומדידות עצמיות — נבנה בשלב 6." />} />
          <Route path="/library" element={<Placeholder title="ספריית התנועות" text="כל תנועה עם וידאו, לולאה והילוך איטי — נבנה בשלב 6." />} />
          <Route path="/settings" element={<Placeholder title="הגדרות" text="מסלול, קול, מוזיקה, מראה, גודל טקסט, תזכורות — נבנה בשלב 6." />} />
        </Routes>
      </main>
      {!fullscreen && (
        <nav className="fixed bottom-0 inset-x-0 border-t border-[var(--line)] bg-[var(--bg-elev)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="ניווט ראשי">
          <ul className="flex max-w-[520px] mx-auto">
            {TABS.map(t => (
              <li key={t.to} className="flex-1">
                <NavLink to={t.to} end={t.to === '/'} className={({ isActive }) => `flex flex-col items-center justify-center min-h-[64px] font-semibold ${isActive ? 'text-[var(--color-bamboo)]' : 'text-[var(--fg-soft)]'}`}>
                  {t.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
