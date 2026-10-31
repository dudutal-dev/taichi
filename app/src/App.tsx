import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Today from './screens/Today';
import Player from './screens/Player';
import Finish from './screens/Finish';
import Onboarding from './screens/Onboarding';
import Measure from './screens/Measure';
import Plan from './screens/Plan';
import Progress from './screens/Progress';
import Library from './screens/Library';
import Settings from './screens/Settings';
import Download from './screens/Download';
import UpdateBanner from './components/UpdateBanner';
import Splash from './components/Splash';
import TabBar from './components/TabBar';
import { getProfile, getSettings, applyDisplaySettings } from './db';
import { scheduleReminderCheck } from './lib/reminders';

export default function App() {
  const loc = useLocation();
  const [ready, setReady] = useState<null | boolean>(null); // null=טוען, false=צריך פתיחה, true=מוכן
  const [splash, setSplash] = useState(() => !sessionStorage.getItem('splashed')); // פעם אחת לכל פתיחה של האפליקציה
  const endSplash = () => { sessionStorage.setItem('splashed', '1'); setSplash(false); };
  const immersive = loc.pathname.startsWith('/session') || loc.pathname.startsWith('/onboarding') || loc.pathname.startsWith('/measure');
  useEffect(() => {
    (async () => {
      const p = await getProfile();
      applyDisplaySettings(await getSettings());
      setReady(!!p?.onboarded);
      if (p?.onboarded && 'Notification' in window && Notification.permission === 'granted') scheduleReminderCheck();
    })();
  }, [loc.pathname]);
  if (splash) return <Splash onDone={endSplash} />;
  if (ready === null) return <div className="min-h-dvh grid place-items-center text-xl">טוען…</div>;
  if (!ready && !loc.pathname.startsWith('/onboarding') && !loc.pathname.startsWith('/measure')) return <Navigate to="/onboarding" replace />;

  return (
    <div className="min-h-dvh flex flex-col">
      <UpdateBanner />
      <main className={loc.pathname.startsWith('/session') ? 'flex-1' : 'flex-1 w-full max-w-[520px] mx-auto px-4 pb-32 pt-4'}>
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
          <Route path="/download" element={<Download />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!immersive && <TabBar />}
    </div>
  );
}
