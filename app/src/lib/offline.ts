// הורדת כל התוכן לשימוש ללא רשת: המניפסט → כל הווידאו והקריינות אל Cache API (אותו מטמון של ה-service worker).
import { contentUrl, loadManifest } from '../content/manifest';

export const MEDIA_CACHE = 'taichi-media';

export interface DownloadPlan { urls: string[]; bytes: number }

export async function planDownload(portrait = false): Promise<DownloadPlan> {
  const m = await loadManifest();
  const urls = new Set<string>();
  let bytes = 0;
  for (const mv of m.movements) for (const c of mv.clips) {
    if (c.still) { urls.add(c.still); bytes += 120_000; } // סטילים (JPEG 960px): פריטי "סטיל + קריינות", גם לקליפים שנדחו או שעוד לא נוצרו
    if (c.qa !== 'approved' || !c.url) continue;
    urls.add(c.url); bytes += c.bytes ?? 0;
    if (portrait) { urls.add(c.url.replace(/\.mp4$/, '_916.mp4')); bytes += Math.round((c.bytes ?? 0) * 0.6); }
  }
  for (const n of Object.values(m.narration)) { urls.add(n.url); bytes += Math.round(n.durationMs * 16); } // 128kbps ≈ 16 בייט/ms
  for (const u of ['audio/music/music_preview.mp3', 'audio/ambience/amb_forest_30s.mp3', 'audio/ambience/amb_stream_30s.mp3', 'audio/ambience/amb_wind_30s.mp3', 'audio/ui/ui_start.mp3', 'audio/ui/ui_next.mp3', 'audio/ui/ui_end.mp3', 'audio/ui/ui_celebrate.mp3', 'character/front.png', 'character/side.png', 'illustrations/measure_single_leg.jpg', 'illustrations/measure_sit_to_stand.jpg', 'illustrations/measure_tug.jpg']) urls.add(u);
  for (const u of [m.character.seatedFront, m.character.seatedSide]) if (u) urls.add(u);
  return { urls: [...urls], bytes };
}

export async function cachedCount(urls: string[]): Promise<number> {
  if (!('caches' in window)) return 0;
  const cache = await caches.open(MEDIA_CACHE);
  let n = 0;
  for (const u of urls) if (await cache.match(contentUrl(u))) n++;
  return n;
}

/** מוריד שלב-שלב; קורא ל-onProgress אחרי כל קובץ. מדלג על מה שכבר במטמון. */
export async function downloadAll(urls: string[], onProgress: (done: number, total: number, failed: number) => void, signal?: AbortSignal): Promise<{ done: number; failed: number }> {
  if (!('caches' in window)) throw new Error('הדפדפן לא תומך במטמון לא-מקוון');
  const cache = await caches.open(MEDIA_CACHE);
  let done = 0, failed = 0;
  for (const u of urls) {
    if (signal?.aborted) break;
    const full = contentUrl(u);
    if (!(await cache.match(full))) {
      try { const r = await fetch(full, { signal }); if (r.ok) await cache.put(full, r); else failed++; } catch { failed++; }
    }
    done++; onProgress(done, urls.length, failed);
  }
  return { done, failed };
}

export const formatMB = (bytes: number) => `${Math.max(1, Math.round(bytes / 1e6))}MB`;
