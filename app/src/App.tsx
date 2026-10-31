import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import Today from './screens/Today';
import Player from './screens/Player';
import Finish from './screens/Finish';
import Onboarding from './screens/Onboarding';
import Measure from './screens/Measure';
import Plan from './screens/Plan';
import Progress from './screens/Progress';
import Library from './screens/Library';
import Settings from './screens/Settings';
import { getProfile, getSettings, applyDisplaySettings } from './db';
import { scheduleReminderCheck } from './lib/reminders';

const TABS = [
  { to: '/', label: 'היום' },
  { to: '/plan', label: 'התוכנית' },
  { to: '/progress', label: 'ההתקדמות' },
  { to: '/library', label: 'הספרייה' },
];

export default function App() {
  const loc = useLocation();
  const [ready, setReady] = useState<null | boolean>(null); // null=טוען, false=צריך פתיחה, true=מוכן
  const immersive = loc.pathname.startsWith('/session') || loc.pathname.startsWith('/onboarding') || loc.pathname.startsWith('/measure');
  useEffect(() => {
    (async () => {
      const p = await getProfile();
      applyDisplaySettings(await getSettings());
      setReady(!!p?.onboarded);
      if (p?.onboarded && 'Notification' in window && Notification.permission === 'granted') scheduleReminderCheck();
    })();
  }, [loc.pathname]);
  if (ready === null) return <div className="min-h-dvh grid place-items-center text-xl">טוען…</div>;
  if (!ready && !loc.pathname.startsWith('/onboarding') && !loc.pathname.startsWith('/measure')) return <Navigate to="/onboarding" replace />;

  return (
    <div className="min-h-dvh flex flex-col">
      <main className={loc.pathname.startsWith('/session') ? 'flex-1' : 'flex-1 w-full max-w-[520px] mx-auto px-4 pb-28 pt-4'}>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/measure/:week" element={<Measure />} />
          <Route path="/session/:week" element={<Player />} />
          <Route path="/finish" element={<Finish />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:id" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!immersive && (
        <nav className="fixed bottom-0 inset-x-0 border-t border-[var(--line)] bg-[var(--bg-elev)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="ניווט ראשי">
          <ul className="flex max-w-[520px] mx-auto">
            {TABS.map(t => (
              <li key={t.to} className="flex-1">
                <NavLink to={t.to} end={t.to === '/'} className={({ isActive }) => `flex flex-col items-center justify-center min-h-[64px] font-semibold ${isActive ? 'text-[var(--color-bamboo)]' : 'text-[var(--fg-soft)]'}`}>{t.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
