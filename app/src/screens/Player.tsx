// נגן מסך מלא: וידאו (מבט-מראה), כתובית, מד "גובה עמידה", פס התקדמות, קריינות מסונכרנת עם ducking למוזיקה.
// מחוות: הקשה = השהיה; לחיצה ארוכה = הילוך איטי + לולאה; כפתורים חלופיים לכל פעולה. כפתור עצור תמיד נראה.
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { buildSession, type PlaylistItem } from '../content/plan';
import { contentUrl, loadManifest, type Manifest } from '../content/manifest';
import { getSettings } from '../db';

const MUSIC_URL = 'audio/music/music_preview.mp3'; // תצוגה של 60 ש' בלולאה עד שדודו בוחר רצועה (שלב 4)
const DUCK = 0.25, MUSIC_VOL = 0.35;

export default function Player() {
  const { week: weekParam } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const week = Number(weekParam ?? 1);
  const short = sp.get('short') === '1';

  const [m, setM] = useState<Manifest | null>(null);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mirror, setMirror] = useState(true);
  const [slow, setSlow] = useState(false);
  const [view, setView] = useState<'front' | 'side'>('front');
  const [loopsDone, setLoopsDone] = useState(0);
  const [narDone, setNarDone] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [musicOn, setMusicOn] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const narRef = useRef<HTMLAudioElement | null>(null);
  const pressTimer = useRef<number | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => { loadManifest().then(setM); getSettings().then(s => { setMirror(s.mirror); setMusicOn(s.music !== 'off'); }); }, []);
  const session = useMemo(() => (m ? buildSession(m, week, { short }) : null), [m, week, short]);
  const items = session?.items ?? [];
  const item: PlaylistItem | undefined = items[idx];

  // מסך לא כבה
  useEffect(() => {
    navigator.wakeLock?.request('screen').then(l => { wakeLock.current = l; }).catch(() => {});
    return () => { wakeLock.current?.release().catch(() => {}); };
  }, []);

  // מונה דקות בפועל
  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => setElapsedMs(v => v + 1000), 1000);
    return () => window.clearInterval(t);
  }, [paused]);

  // קריינות: תור סדרתי לכל פריט; המוזיקה יורדת −12dB בזמן דיבור וחוזרת אחרי 1.5 ש'
  useEffect(() => {
    if (!item || !m) return;
    setLoopsDone(0); setNarDone(false); setView('front');
    const ids = item.narration.filter(id => m.narration[id]?.url);
    let i = 0, cancelled = false;
    const duck = (on: boolean) => { const mu = musicRef.current; if (!mu) return; mu.volume = on ? MUSIC_VOL * DUCK : MUSIC_VOL; };
    const playNext = () => {
      if (cancelled) return;
      const id = ids[i++];
      if (!id) { window.setTimeout(() => duck(false), 1500); setNarDone(true); return; }
      const a = new Audio(contentUrl(m.narration[id]!.url));
      narRef.current = a; duck(true);
      a.onended = () => window.setTimeout(playNext, 500);
      a.onerror = () => playNext();
      a.play().catch(() => playNext());
    };
    playNext();
    return () => { cancelled = true; narRef.current?.pause(); narRef.current = null; };
  }, [item, m]);

  // פריט מסתיים כשגם הלולאות וגם הקריינות הסתיימו (פריט סטיל: רק קריינות)
  useEffect(() => {
    if (!item) return;
    const loopsOk = item.loops === 0 || loopsDone >= item.loops;
    if (loopsOk && narDone && !slow) {
      if (idx + 1 < items.length) setIdx(idx + 1); else finish('done');
    }
  }, [loopsDone, narDone, item, idx, items.length, slow]);

  // השהיה/המשך
  useEffect(() => {
    const v = videoRef.current, mu = musicRef.current, n = narRef.current;
    if (paused) { v?.pause(); mu?.pause(); n?.pause(); } else { v?.play().catch(() => {}); if (musicOn) mu?.play().catch(() => {}); n?.play().catch(() => {}); }
  }, [paused, musicOn, idx]);

  useEffect(() => { const v = videoRef.current; if (v) v.playbackRate = slow ? 0.5 : 1; }, [slow, idx, view]);

  const finish = useCallback((status: 'done' | 'stopped') => {
    const actualMin = Math.max(1, Math.round(elapsedMs / 60000));
    const planned = session?.plannedMin ?? 20;
    const st = status === 'done' ? (short ? 'partial' : 'done') : actualMin >= 10 ? 'partial' : 'stopped';
    nav('/finish', { replace: true, state: { week, actualMin, status: st, plannedMin: planned, movements: [...new Set(items.map(i => i.movementId))] } });
  }, [elapsedMs, session, short, nav, week, items]);

  if (!m || !item) return <div className="min-h-dvh grid place-items-center text-xl">טוען את המפגש…</div>;

  const src = view === 'side' && item.sideUrl ? item.sideUrl : item.frontUrl;
  const progress = items.length ? (idx / items.length) * 100 : 0;
  const go = (d: number) => setIdx(i => Math.max(0, Math.min(items.length - 1, i + d)));

  const onPressStart = () => { pressTimer.current = window.setTimeout(() => setSlow(true), 600); };
  const onPressEnd = (tap: boolean) => {
    if (pressTimer.current) { window.clearTimeout(pressTimer.current); pressTimer.current = null; }
    if (tap && !slow) setPaused(p => !p);
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col select-none" dir="rtl">
      <div className="h-1.5 bg-white/15"><div className="h-full bg-[var(--color-bamboo-soft)] transition-[width] duration-700" style={{ width: `${progress}%` }} /></div>

      <div className="relative flex-1 grid place-items-center overflow-hidden"
        onPointerDown={onPressStart} onPointerUp={() => onPressEnd(true)} onPointerLeave={() => onPressEnd(false)} onPointerCancel={() => onPressEnd(false)}>
        {src ? (
          <video key={src + idx} ref={videoRef} src={contentUrl(src)} playsInline autoPlay muted={false} preload="auto"
            className="max-h-full max-w-full" style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
            onEnded={e => { if (slow || loopsDone + 1 < item.loops) { e.currentTarget.currentTime = 0; e.currentTarget.play(); } setLoopsDone(n => n + 1); }}
            x-webkit-airplay="allow" />
        ) : (
          <img src={contentUrl(item.stillUrl)} alt="" className="max-h-full max-w-full" style={{ transform: mirror ? 'scaleX(-1)' : undefined }} />
        )}
        <div className="absolute top-3 right-3 left-3 flex items-start justify-between gap-3 pointer-events-none">
          <div className="bg-black/55 rounded-2xl px-4 py-2">
            <div className="text-2xl font-extrabold">{item.title}</div>
            <div className="text-white/80">{item.caption}{slow ? ' · הילוך איטי' : ''}{paused ? ' · מושהה' : ''}</div>
          </div>
          <div className="bg-[var(--color-bamboo)]/85 rounded-2xl px-3 py-2 text-sm leading-tight max-w-[46%]" aria-label="מד גובה עמידה">
            ברך מעל כף הרגל<br />כיפוף קל בלבד<br />כואב? להזדקף
          </div>
        </div>
        {paused && <div className="absolute inset-0 grid place-items-center pointer-events-none"><div className="bg-black/60 rounded-full px-8 py-4 text-2xl font-extrabold">מושהה</div></div>}
      </div>

      <div className="flex flex-wrap items-center gap-2 p-3 bg-black/90" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + .75rem)' }}>
        <button className="btn-stop" onClick={() => finish('stopped')}>עצור</button>
        <button className="chip !bg-white/10 !border-white/25 !text-white" onClick={() => setPaused(p => !p)}>{paused ? 'המשך' : 'השהה'}</button>
        <button className="chip !bg-white/10 !border-white/25 !text-white" onClick={() => go(-1)} disabled={idx === 0}>הקודם</button>
        <button className="chip !bg-white/10 !border-white/25 !text-white" onClick={() => go(1)} disabled={!item.skippable && item.phase === 'warmup'} title={!item.skippable ? 'חימום לא ניתן לדילוג בשבועות 1–4' : ''}>הבא</button>
        <button className="chip !bg-white/10 !border-white/25 !text-white" aria-pressed={slow} onClick={() => setSlow(s => !s)}>הילוך איטי</button>
        <button className="chip !bg-white/10 !border-white/25 !text-white" aria-pressed={mirror} onClick={() => setMirror(v => !v)}>מראה</button>
        {item.sideAvailable && <button className="chip !bg-white/10 !border-white/25 !text-white" aria-pressed={view === 'side'} onClick={() => setView(v => (v === 'side' ? 'front' : 'side'))}>מבט צד</button>}
        <button className="chip !bg-white/10 !border-white/25 !text-white" aria-pressed={musicOn} onClick={() => setMusicOn(v => !v)}>מוזיקה</button>
        <span className="mr-auto text-white/70 tabular-nums">{Math.floor(elapsedMs / 60000)}:{String(Math.floor(elapsedMs / 1000) % 60).padStart(2, '0')}</span>
      </div>

      {musicOn && <audio ref={musicRef} src={contentUrl(MUSIC_URL)} loop autoPlay onCanPlay={e => { e.currentTarget.volume = MUSIC_VOL; }} />}
    </div>
  );
}
