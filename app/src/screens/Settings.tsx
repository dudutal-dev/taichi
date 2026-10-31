// הגדרות: מסלול, קול, מוזיקה/אווירה/שקט, ספירת נשימה, מבט-מראה, גודל טקסט, תזכורות (לכל יום), ייצוא/ייבוא JSON, איפוס.
import { useEffect, useRef, useState } from 'react';
import { db, getProfile, getSettings, applyDisplaySettings, exportAll, importAll, resetAll, DEFAULT_SETTINGS, type Profile, type Settings as S, type Track } from '../db';
import { requestReminderPermission, scheduleReminderCheck } from '../lib/reminders';

const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export default function Settings() {
  const [p, setP] = useState<Profile | null>(null);
  const [s, setS] = useState<S>(DEFAULT_SETTINGS);
  const [note, setNote] = useState('');
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { getProfile().then(setP); getSettings().then(setS); }, []);

  async function saveS(patch: Partial<S>) { const n = { ...s, ...patch }; setS(n); await db.settings.put(n); applyDisplaySettings(n); }
  async function saveP(patch: Partial<Profile>) { if (!p) return; const n = { ...p, ...patch }; setP(n); await db.profile.put(n); }

  const Opt = <T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) => (
    <div><div className="font-extrabold mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">{options.map(([v, l]) => <button key={v} className="chip" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>)}</div></div>
  );

  if (!p) return null;
  return (
    <section className="flex flex-col gap-6 pt-2 pb-8">
      <h1 className="text-3xl font-extrabold">הגדרות</h1>
      <Opt<Track> label="מסלול" value={p.track} options={[['main', 'ראשי'], ['joints', 'מפרקים רגישים'], ['seated', 'ישיבה']]} onChange={v => saveP({ track: v })} />
      <Opt label="מוזיקה" value={s.music} options={[['ambient', 'מוזיקה'], ['nature', 'אווירה'], ['off', 'שקט']]} onChange={v => saveS({ music: v })} />
      {s.music === 'nature' && <Opt label="צליל אווירה" value={s.natureSound} options={[['forest', 'יער'], ['stream', 'נחל'], ['wind', 'רוח']]} onChange={v => saveS({ natureSound: v })} />}
      <Opt label="ספירת נשימה" value={s.breathCue} options={[['words', 'מילים'], ['tone', 'צליל'], ['off', 'ללא']]} onChange={v => saveS({ breathCue: v })} />
      <Opt label="מבט" value={s.mirror ? 'mirror' : 'normal'} options={[['mirror', 'מראה'], ['normal', 'רגיל']]} onChange={v => saveS({ mirror: v === 'mirror' })} />
      <Opt label="גודל טקסט" value={s.fontScale} options={[['normal', 'רגיל'], ['large', 'גדול'], ['xl', 'גדול מאוד']]} onChange={v => saveS({ fontScale: v })} />
      <Opt label="מצב תצוגה" value={s.darkMode} options={[['auto', 'אוטומטי'], ['light', 'בהיר'], ['dark', 'כהה לערב']]} onChange={v => saveS({ darkMode: v })} />

      <div>
        <div className="font-extrabold mb-2">תזכורת, רק בימים שבחרת</div>
        <div className="flex gap-2">{DAYS.map((d, i) => <button key={i} className="chip flex-1 justify-center" aria-pressed={p.reminderDays.includes(i)} onClick={() => saveP({ reminderDays: p.reminderDays.includes(i) ? p.reminderDays.filter(x => x !== i) : [...p.reminderDays, i].sort() })}>{d}</button>)}</div>
        <label className="flex items-center justify-between mt-3"><span>שעה</span><input type="time" className="chip" value={p.reminderTime} onChange={e => saveP({ reminderTime: e.target.value })} /></label>
        <button className="btn-secondary mt-3" onClick={async () => { const ok = await requestReminderPermission(); setNote(ok ? 'תזכורות מופעלות. "הבמבוק מחכה" יופיע בשעה שבחרת כשהאפליקציה פתוחה או מותקנת.' : 'הדפדפן לא אישר התראות.'); if (ok) scheduleReminderCheck(); }}>הפעל תזכורות במכשיר</button>
      </div>

      <div className="card p-4 flex flex-col gap-3">
        <h2 className="font-extrabold">הנתונים שלך</h2>
        <p className="text-[var(--fg-soft)]">הכול במכשיר הזה בלבד. גיבוי ידני לקובץ JSON.</p>
        <button className="btn-secondary" onClick={async () => { const blob = new Blob([await exportAll()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `taichi150-${new Date().toISOString().slice(0, 10)}.json`; a.click(); }}>ייצוא לקובץ</button>
        <button className="btn-secondary" onClick={() => file.current?.click()}>ייבוא מקובץ</button>
        <input ref={file} type="file" accept="application/json" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; try { await importAll(await f.text()); setNote('הנתונים יובאו.'); location.reload(); } catch { setNote('הקובץ לא נקרא.'); } }} />
        <button className="btn-secondary !border-[var(--color-stop)] !text-[var(--color-stop)]" onClick={async () => { if (confirm('למחוק את כל הנתונים במכשיר? אי אפשר לבטל.')) { await resetAll(); location.hash = '#/'; location.reload(); } }}>איפוס מלא</button>
      </div>
      {note && <p className="card p-3">{note}</p>}
      <p className="text-[var(--fg-soft)] text-sm">קול הקריינות נבחר בייצור התוכן ואינו ניתן לשינוי במכשיר.</p>
    </section>
  );
}
