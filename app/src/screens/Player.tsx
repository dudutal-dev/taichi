// נגן מסך מלא. עקרונות לטלפון:
// - "התחל מפגש" בנגיעה אחת משחרר וידאו, מוזיקה וקריינות (iOS/Android מתירים שמע רק מתוך נגיעה).
// - אלמנט מוזיקה אחד קבוע (רק מושתק/מופעל) ואלמנט קריינות אחד קבוע (משנים src).
// - הפקדים צפים על הווידאו באזור האגודל, מעל תחתית המסך, לא בקצה העליון ולא בקצה התחתון.
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { buildSession, type PlaylistItem } from '../content/plan';
import { contentUrl, loadManifest, type Manifest } from '../content/manifest';
import { getSettings } from '../db';

const MUSIC_URL = 'audio/music/music_preview.mp3';
const MUSIC_GAIN = 0.7, DUCK_GAIN = 0.28; // מוזיקה ברקע; בזמן קריינות יורדת (−8dB בערך) — דרך Web Audio, כי iOS מתעלם מ-element.volume

export default function Player() {
  const { week: weekParam } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const week = Number(weekParam ?? 1);
  const short = sp.get('short') === '1';
  const track = (sp.get('track') as 'main' | 'joints' | 'seated' | null) ?? 'main';
  const firstOfWeek = sp.get('first') === '1';
  const skipBalance = sp.get('nobal') === '1';

  const [m, setM] = useState<Manifest | null>(null);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mirror, setMirror] = useState(true);
  const [slow, setSlow] = useState(false);
  const [view, setView] = useState<'front' | 'side'>('front');
  const [loopsDone, setLoopsDone] = useState(0);
  const [narDone, setNarDone] = useState(false);     // קריינות הפתיחה של הקטע הסתיימה
  const [endPhase, setEndPhase] = useState<'idle' | 'playing' | 'done'>('idle'); // קריינות הסיום של הקטע
  const doneRef = useRef(false); // האם הקטע הושלם (לשימוש בתוך onEnded של הווידאו)
  const [elapsedMs, setElapsedMs] = useState(0);
  const [musicOn, setMusicOn] = useState(true);
  const [more, setMore] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [musicUrl, setMusicUrl] = useState(MUSIC_URL);
  const [portrait, setPortrait] = useState(() => window.matchMedia('(orientation: portrait)').matches);

  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const narRef = useRef<HTMLAudioElement>(null);
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const audio = useRef<{ ctx: AudioContext; music: GainNode; nar: GainNode } | null>(null);

  useEffect(() => { loadManifest().then(setM); getSettings().then(s => { setMirror(s.mirror); setMusicOn(s.music !== 'off'); if (s.music === 'nature') setMusicUrl(`audio/ambience/amb_${s.natureSound}_30s.mp3`); }); }, []);
  useEffect(() => { const mq = window.matchMedia('(orientation: portrait)'); const h = (e: MediaQueryListEvent) => setPortrait(e.matches); mq.addEventListener('change', h); return () => mq.removeEventListener('change', h); }, []);
  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(null), 4000); return () => window.clearTimeout(t); }, [toast]);
  const session = useMemo(() => (m ? buildSession(m, week, { short, track: track === 'joints' ? 'main' : track, firstOfWeek, skipBalance }) : null), [m, week, short, track, firstOfWeek, skipBalance]); // joints: עד שרשימת TCA תאושר — המסלול הראשי
  const items = session?.items ?? [];
  const item: PlaylistItem | undefined = items[idx];

  // מסך לא כבה
  useEffect(() => {
    if (!started) return;
    const req = () => navigator.wakeLock?.request('screen').then(l => { wakeLock.current = l; }).catch(() => {});
    req();
    const re = () => { if (document.visibilityState === 'visible') req(); };
    document.addEventListener('visibilitychange', re);
    return () => { document.removeEventListener('visibilitychange', re); wakeLock.current?.release().catch(() => {}); };
  }, [started]);

  // מונה דקות בפועל
  useEffect(() => {
    if (!started || paused) return;
    const t = window.setInterval(() => setElapsedMs(v => v + 1000), 1000);
    return () => window.clearInterval(t);
  }, [started, paused]);

  /** מנגן תור קריינות באלמנט האחד; המוזיקה יורדת −12dB בזמן דיבור וחוזרת אחרי 1.5 ש'. מחזיר ביטול. */
  const playQueue = useCallback((ids: string[], onDone: () => void) => {
    const a = narRef.current; if (!a || !m) { onDone(); return () => {}; }
    const list = ids.filter(id => m.narration[id]?.url);
    let i = 0, cancelled = false;
    const duck = (on: boolean) => { const g = audio.current; if (!g) return; g.music.gain.cancelScheduledValues(g.ctx.currentTime); g.music.gain.linearRampToValueAtTime(on ? DUCK_GAIN : MUSIC_GAIN, g.ctx.currentTime + (on ? 0.3 : 1.5)); };
    const playNext = () => {
      if (cancelled) return;
      const id = list[i++];
      if (!id) { window.setTimeout(() => duck(false), 1500); onDone(); return; }
      a.src = contentUrl(m.narration[id]!.url); duck(true);
      a.onended = () => window.setTimeout(playNext, 500);
      a.onerror = () => playNext();
      a.play().catch(() => playNext());
    };
    playNext();
    return () => { cancelled = true; a.onended = null; a.pause(); };
  }, [m]);

  // תחילת קטע: איפוס + קריינות הפתיחה
  useEffect(() => {
    if (!started || !item || !m) return;
    setLoopsDone(0); setNarDone(false); setEndPhase('idle'); doneRef.current = false;
    setView(item.mode === 'side' && item.sideUrl ? 'side' : 'front'); // פריט "מבט צד" נפתח במבט צד (באג: תמיד נפתח בחזית)
    return playQueue(item.narration, () => setNarDone(true));
  }, [started, item, m, playQueue]);

  // סוף קטע: כשהלולאות והקריינות הסתיימו → קריינות הסיום (למשל "החימום הסתיים") → ורק אז הלאה
  useEffect(() => {
    if (!started || !item || slow) return;
    const loopsOk = item.loops === 0 || loopsDone >= item.loops;
    if (!(loopsOk && narDone)) return;
    if (endPhase === 'idle') {
      if (item.narrationEnd.length === 0) { setEndPhase('done'); return; }
      setEndPhase('playing');
      return playQueue(item.narrationEnd, () => setEndPhase('done'));
    }
    if (endPhase === 'done') {
      doneRef.current = true;
      if (idx + 1 < items.length) setIdx(idx + 1); else finish('done');
    }
  }, [started, loopsDone, narDone, endPhase, item, idx, items.length, slow, playQueue]);

  // השהיה/המשך + מוזיקה
  useEffect(() => {
    if (!started) return;
    const v = videoRef.current, mu = musicRef.current, n = narRef.current;
    if (paused) { v?.pause(); mu?.pause(); n?.pause(); }
    else { v?.play().catch(() => {}); if (n?.src && !n.ended) n.play().catch(() => {}); if (mu) { mu.muted = !musicOn; if (musicOn) mu.play().catch(() => {}); } audio.current?.ctx.resume().catch(() => {}); }
  }, [started, paused, musicOn, idx]);

  useEffect(() => { const v = videoRef.current; if (v) v.playbackRate = slow ? 0.5 : 1; }, [slow, idx, view]);

  const finish = useCallback((status: 'done' | 'stopped') => {
    const actualMin = Math.max(1, Math.round(elapsedMs / 60000));
    const planned = session?.plannedMin ?? 20;
    const st = status === 'done' ? (short ? 'partial' : 'done') : actualMin >= 10 ? 'partial' : 'stopped';
    nav('/finish', { replace: true, state: { week, actualMin, status: st, plannedMin: planned, movements: [...new Set(items.map(i => i.movementId))] } });
  }, [elapsedMs, session, short, nav, week, items]);

  /** נגיעה אחת שמשחררת את כל המדיה (iOS/Android) ובונה את המיקסר: מוזיקה וקריינות דרך GainNodes. */
  function start() {
    const mu = musicRef.current, n = narRef.current, v = videoRef.current;
    try {
      if (!audio.current && mu && n) {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const music = ctx.createGain(); music.gain.value = MUSIC_GAIN;
        const nar = ctx.createGain(); nar.gain.value = 1;
        ctx.createMediaElementSource(mu).connect(music).connect(ctx.destination);
        ctx.createMediaElementSource(n).connect(nar).connect(ctx.destination);
        audio.current = { ctx, music, nar };
      }
      audio.current?.ctx.resume().catch(() => {});
    } catch { /* בלי Web Audio: נופלים חזרה לעוצמת האלמנט */ }
    if (mu) { mu.volume = 1; mu.muted = !musicOn; mu.play().catch(() => {}); }
    if (n) { n.muted = false; n.volume = 1; n.play().then(() => n.pause()).catch(() => {}); }
    v?.play().catch(() => {});
    setStarted(true);
  }

  function cast() {
    const v = videoRef.current as (HTMLVideoElement & { webkitShowPlaybackTargetPicker?: () => void }) | null;
    if (!v) return;
    if (typeof v.webkitShowPlaybackTargetPicker === 'function') { v.webkitShowPlaybackTargetPicker(); return; } // AirPlay (Safari)
    if (v.remote && typeof v.remote.prompt === 'function') { v.remote.prompt().catch(() => setToast('לא נמצא מסך לשידור. בטלוויזיה: לוודא ש-Chromecast או AirPlay דולקים באותה רשת.')); return; }
    setToast('הדפדפן הזה לא תומך בשידור מהאפליקציה. אפשר לשקף את המסך מהגדרות הטלפון (שיקוף מסך / Cast).');
  }

  if (!m || !item) return <div className="min-h-dvh grid place-items-center text-xl">טוען את המפגש…</div>;

  const base = view === 'side' && item.sideUrl ? item.sideUrl : item.frontUrl;
  const src = base && portrait ? base.replace(/\.mp4$/, '_916.mp4') : base;
  const progress = items.length ? (idx / items.length) * 100 : 0;
  const go = (d: number) => setIdx(i => Math.max(0, Math.min(items.length - 1, i + d)));
  const canSkip = item.skippable || item.phase !== 'warmup';
  const onPointerDown = () => { longPressed.current = false; pressTimer.current = window.setTimeout(() => { longPressed.current = true; setSlow(true); }, 600); };
  const onPointerUp = () => { if (pressTimer.current) { window.clearTimeout(pressTimer.current); pressTimer.current = null; } };
  const onVideoClick = () => { if (started && !longPressed.current) setPaused(p => !p); };
  const tog = 'chip !min-h-12 !px-3 !bg-black/55 !border-white/30 !text-white backdrop-blur';

  return (
    <div className="fixed inset-0 bg-black text-white select-none" dir="rtl">
      {/* וידאו / סטיל ממלא את כל המסך */}
      <div className="absolute inset-0" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onClick={onVideoClick}>
        {src ? (
          <video key={src + idx} ref={videoRef} src={contentUrl(src)} playsInline preload="auto" autoPlay={started}
            className="w-full h-full object-contain" style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
            onEnded={e => { setLoopsDone(n => n + 1); if (!doneRef.current) { e.currentTarget.currentTime = 0; e.currentTarget.play().catch(() => {}); } }} /* ממשיכים ללולאה עד שהקטע באמת נגמר (כולל קריינות) */
            x-webkit-airplay="allow" />
        ) : (
          <img src={contentUrl(item.stillUrl)} alt="" className="w-full h-full object-contain" style={{ transform: mirror ? 'scaleX(-1)' : undefined }} />
        )}
      </div>

      {/* פס התקדמות דק למעלה, מתחת לאזור הסטטוס */}
      <div className="absolute inset-x-0 h-1 bg-white/15" style={{ top: 'env(safe-area-inset-top)' }}><div className="h-full bg-[var(--color-bamboo-soft)] transition-[width] duration-700" style={{ width: `${progress}%` }} /></div>

      {/* כתובית + מד גובה עמידה: צפים, בלי לחסום נגיעות */}
      <div className="absolute right-3 left-3 flex items-start justify-between gap-2 pointer-events-none" style={{ top: 'calc(env(safe-area-inset-top) + .75rem)' }}>
        <div className="bg-black/55 backdrop-blur rounded-2xl px-3 py-1.5 max-w-[62%]">
          <div className="text-lg font-extrabold leading-tight">{item.title}</div>
          <div className="text-white/80 text-sm leading-tight">{item.caption}{slow ? ' · איטי' : ''}</div>
        </div>
        <div className="bg-[var(--color-bamboo)]/85 backdrop-blur rounded-2xl px-2.5 py-1.5 text-xs leading-tight text-end" aria-label="מד גובה עמידה">
          ברך מעל כף הרגל<br />כיפוף קל בלבד<br />כואב? להזדקף
        </div>
      </div>

      {/* מסך התחלה: נגיעה אחת משחררת מדיה */}
      {!started && (
        <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <div className="text-3xl font-extrabold">{short ? 'עשר דקות' : `שבוע ${week}`}</div>
            <div className="text-white/80">{session?.plannedMin} דקות · {items.length} קטעים · כיסא או קיר בהישג יד</div>
            <button className="btn-primary !w-auto !px-12 !text-2xl" onClick={start}>התחל מפגש</button>
            <button className="chip !bg-white/10 !border-white/30 !text-white" onClick={() => nav('/', { replace: true })}>חזרה</button>
          </div>
        </div>
      )}

      {paused && started && <div className="absolute inset-0 grid place-items-center pointer-events-none"><div className="bg-black/60 rounded-full px-8 py-4 text-2xl font-extrabold">מושהה</div></div>}
      {toast && <div className="absolute inset-x-4 top-24 card !bg-black/80 !border-white/20 text-white p-3 text-center z-10">{toast}</div>}

      {/* פקדים צפים באזור האגודל, מעל תחתית המסך */}
      {started && (
        <div className="absolute inset-x-0 flex flex-col items-center gap-3 px-4" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 28px)' }}>
          {more && (
            <div className="flex flex-wrap justify-center gap-2">
              <button className={tog} onClick={() => go(-1)} disabled={idx === 0}>הקודם</button>
              <button className={tog} aria-pressed={slow} onClick={() => setSlow(s => !s)}>הילוך איטי</button>
              <button className={tog} aria-pressed={mirror} onClick={() => setMirror(v => !v)}>מראה</button>
              {item.sideAvailable && <button className={tog} aria-pressed={view === 'side'} onClick={() => setView(v => (v === 'side' ? 'front' : 'side'))}>מבט צד</button>}
              <button className={tog} aria-pressed={musicOn} onClick={() => setMusicOn(v => !v)}>{musicOn ? 'מוזיקה: פועלת' : 'מוזיקה: כבויה'}</button>
              <button className={tog} onClick={cast}>שדר למסך</button>
            </div>
          )}
          <div className="w-full max-w-[460px] bg-black/60 backdrop-blur rounded-[28px] p-2 flex items-center justify-between gap-2">
            <button className="btn-stop !min-h-[60px] !px-5 !rounded-[22px]" onClick={() => finish('stopped')}>עצור</button>
            <button className="w-[72px] h-[72px] rounded-full bg-[var(--color-cream)] text-[var(--color-bamboo-deep)] font-extrabold text-lg grid place-items-center shadow-lg active:scale-95 transition-transform" onClick={() => setPaused(p => !p)} aria-label={paused ? 'המשך' : 'השהה'}>
              {paused ? '▶' : '❚❚'}
            </button>
            <button className="chip !min-h-[60px] !px-5 !rounded-[22px] !bg-white/15 !border-white/30 !text-white !text-lg" onClick={() => go(1)} disabled={!canSkip} title={!canSkip ? 'חימום לא ניתן לדילוג בשבועות 1–4' : ''}>הבא</button>
          </div>
          <div className="flex items-center gap-3 text-white/70 tabular-nums text-sm">
            <span>{idx + 1}/{items.length} · {Math.floor(elapsedMs / 60000)}:{String(Math.floor(elapsedMs / 1000) % 60).padStart(2, '0')}</span>
            <button className="chip !min-h-10 !px-3 !bg-black/50 !border-white/25 !text-white !text-sm" aria-expanded={more} onClick={() => setMore(v => !v)}>{more ? 'פחות' : 'עוד אפשרויות'}</button>
          </div>
        </div>
      )}

      <audio ref={musicRef} src={contentUrl(musicUrl)} loop preload="auto" />
      <audio ref={narRef} preload="auto" />
    </div>
  );
}
