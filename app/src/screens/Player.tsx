// נגן מסך מלא: וידאו (מבט-מראה), כתובית, מד "גובה עמידה", פס התקדמות, קריינות מסונכרנת עם ducking למוזיקה.
// טלפון: הווידאו ממלא את כל השטח הפנוי (min-h-0 + object-contain), שורת פקודות אחת גדולה + מתגים קטנים.
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
  const [more, setMore] = useState(false);
  const [musicUrl, setMusicUrl] = useState(MUSIC_URL);
  const [portrait, setPortrait] = useState(() => window.matchMedia('(orientation: portrait)').matches);

  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const narRef = useRef<HTMLAudioElement | null>(null);
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => { loadManifest().then(setM); getSettings().then(s => { setMirror(s.mirror); setMusicOn(s.music !== 'off'); if (s.music === 'nature') setMusicUrl(`audio/ambience/amb_${s.natureSound}_30s.mp3`); }); }, []);
  useEffect(() => { const mq = window.matchMedia('(orientation: portrait)'); const h = (e: MediaQueryListEvent) => setPortrait(e.matches); mq.addEventListener('change', h); return () => mq.removeEventListener('change', h); }, []);
  const session = useMemo(() => (m ? buildSession(m, week, { short }) : null), [m, week, short]);
  const items = session?.items ?? [];
  const item: PlaylistItem | undefined = items[idx];

  // מסך לא כבה
  useEffect(() => {
    navigator.wakeLock?.request('screen').then(l => { wakeLock.current = l; }).catch(() => {});
    const re = () => { if (document.visibilityState === 'visible') navigator.wakeLock?.request('screen').then(l => { wakeLock.current = l; }).catch(() => {}); };
    document.addEventListener('visibilitychange', re);
    return () => { document.removeEventListener('visibilitychange', re); wakeLock.current?.release().catch(() => {}); };
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

  const base = view === 'side' && item.sideUrl ? item.sideUrl : item.frontUrl;
  const src = base && portrait ? base.replace(/\.mp4$/, '_916.mp4') : base; // 9:16 בפורטרט, 16:9 ברוחב/TV
  const castable = typeof videoRef.current?.remote?.prompt === 'function';
  const progress = items.length ? (idx / items.length) * 100 : 0;
  const go = (d: number) => setIdx(i => Math.max(0, Math.min(items.length - 1, i + d)));
  const canSkip = item.skippable || item.phase !== 'warmup';

  // מחוות על הווידאו: הקשה = השהיה, לחיצה ארוכה = הילוך איטי. (כפתורים חלופיים לכל פעולה למטה)
  const onPointerDown = () => { longPressed.current = false; pressTimer.current = window.setTimeout(() => { longPressed.current = true; setSlow(true); }, 600); };
  const onPointerUp = () => { if (pressTimer.current) { window.clearTimeout(pressTimer.current); pressTimer.current = null; } };
  const onClick = () => { if (!longPressed.current) setPaused(p => !p); };

  const tog = 'chip !min-h-11 !px-3 !text-[0.95rem] !bg-white/10 !border-white/25 !text-white';
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col select-none" dir="rtl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="h-1.5 shrink-0 bg-white/15"><div className="h-full bg-[var(--color-bamboo-soft)] transition-[width] duration-700" style={{ width: `${progress}%` }} /></div>

      <div className="relative flex-1 min-h-0 overflow-hidden" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onClick={onClick}>
        {src ? (
          <video key={src + idx} ref={videoRef} src={contentUrl(src)} playsInline autoPlay preload="auto"
            className="w-full h-full object-contain" style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
            onEnded={e => { if (slow || loopsDone + 1 < item.loops) { e.currentTarget.currentTime = 0; e.currentTarget.play(); } setLoopsDone(n => n + 1); }}
            x-webkit-airplay="allow" />
        ) : (
          <img src={contentUrl(item.stillUrl)} alt="" className="w-full h-full object-contain" style={{ transform: mirror ? 'scaleX(-1)' : undefined }} />
        )}
        <div className="absolute top-2 right-2 left-2 flex items-start justify-between gap-2 pointer-events-none">
          <div className="bg-black/55 rounded-xl px-3 py-1.5 max-w-[60%]">
            <div className="text-lg font-extrabold leading-tight">{item.title}</div>
            <div className="text-white/80 text-sm leading-tight">{item.caption}{slow ? ' · איטי' : ''}{paused ? ' · מושהה' : ''}</div>
          </div>
          <div className="bg-[var(--color-bamboo)]/85 rounded-xl px-2.5 py-1.5 text-xs leading-tight text-end" aria-label="מד גובה עמידה">
            ברך מעל כף הרגל<br />כיפוף קל בלבד<br />כואב? להזדקף
          </div>
        </div>
        {paused && <div className="absolute inset-0 grid place-items-center pointer-events-none"><div className="bg-black/60 rounded-full px-8 py-4 text-2xl font-extrabold">מושהה</div></div>}
      </div>

      <div className="shrink-0 bg-black/90 px-3 pt-2 flex flex-col gap-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + .5rem)' }}>
        <div className="flex items-stretch gap-2">
          <button className="btn-stop flex-[1.2]" onClick={() => finish('stopped')}>עצור</button>
          <button className="chip flex-1 justify-center !min-h-14 !bg-white/10 !border-white/25 !text-white !text-lg" onClick={() => setPaused(p => !p)}>{paused ? 'המשך' : 'השהה'}</button>
          <button className="chip flex-1 justify-center !min-h-14 !bg-white/10 !border-white/25 !text-white !text-lg" onClick={() => go(1)} disabled={!canSkip} title={!canSkip ? 'חימום לא ניתן לדילוג בשבועות 1–4' : ''}>הבא</button>
          <button className={tog + ' !min-h-14'} aria-expanded={more} onClick={() => setMore(v => !v)}>עוד</button>
        </div>
        {more && (
          <div className="flex flex-wrap items-center gap-2">
            <button className={tog} onClick={() => go(-1)} disabled={idx === 0}>הקודם</button>
            <button className={tog} aria-pressed={slow} onClick={() => setSlow(s => !s)}>הילוך איטי</button>
            <button className={tog} aria-pressed={mirror} onClick={() => setMirror(v => !v)}>מראה</button>
            {item.sideAvailable && <button className={tog} aria-pressed={view === 'side'} onClick={() => setView(v => (v === 'side' ? 'front' : 'side'))}>מבט צד</button>}
            <button className={tog} aria-pressed={musicOn} onClick={() => setMusicOn(v => !v)}>מוזיקה</button>
            {castable && <button className={tog} onClick={() => videoRef.current?.remote?.prompt().catch(() => {})}>שדר למסך</button>}
          </div>
        )}
        <div className="flex justify-between text-white/60 text-sm tabular-nums">
          <span>{idx + 1}/{items.length}</span>
          <span>{Math.floor(elapsedMs / 60000)}:{String(Math.floor(elapsedMs / 1000) % 60).padStart(2, '0')}</span>
        </div>
      </div>

      {musicOn && <audio ref={musicRef} src={contentUrl(musicUrl)} loop autoPlay onCanPlay={e => { e.currentTarget.volume = MUSIC_VOL; }} />}
    </div>
  );
}
