// תזכורות מקומיות: Web Notifications. בלי שרת, ההתראה יכולה להופיע רק כשהאפליקציה פתוחה/מותקנת ורצה.
// (Capacitor Local Notifications בהמשך ייתן התראות גם כשהאפליקציה סגורה.)
import { getProfile, db, todayISO } from '../db';

export async function requestReminderPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  return (await Notification.requestPermission()) === 'granted';
}

let timer: number | null = null;
/** בודק פעם בדקה: אם היום נבחר, השעה הגיעה, ועוד לא התאמנו היום — התראה אחת ("הזמנה", לא משימה). */
export function scheduleReminderCheck() {
  if (timer) return;
  const tick = async () => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const p = await getProfile(); if (!p || !p.onboarded) return;
    const now = new Date(); const hhmm = now.toTimeString().slice(0, 5);
    if (!p.reminderDays.includes(now.getDay()) || hhmm !== p.reminderTime) return;
    const key = `reminded-${todayISO()}`; if (localStorage.getItem(key)) return;
    const done = await db.sessions.where('date').equals(todayISO()).count();
    if (done > 0) return;
    try { new Notification('הבמבוק מחכה', { body: 'עשרים דקות, בקצב שלך. או עשר, גם זה נספר.', tag: 'taichi150-daily' }); localStorage.setItem(key, '1'); } catch { /* */ }
  };
  tick(); timer = window.setInterval(tick, 60_000);
}
