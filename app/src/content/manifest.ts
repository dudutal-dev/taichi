// חוזה המניפסט (נכתב על ידי pipeline/06_assemble.mjs). האפליקציה משתמשת רק בפריטים approved.
export type View = 'front' | 'side';
export interface ManifestClip {
  id: string; view: View; method: string; durationMs: number; loop: 'pingpong';
  qa: 'approved' | 'pending' | 'rejected'; qaNote: string; attempt: number; keyframe: string;
  url?: string; loopDurationMs?: number; hash?: string; bytes?: number; still?: string | null;
}
export interface NarrationItem { id: string; url: string; durationMs: number; text: string; qa: string }
export interface ManifestMovement {
  id: string; nameHe: string; pinyin: string; track: string; minWeek: number; kneeLoad: string;
  tips: string[]; skippable?: boolean; clips: ManifestClip[]; narration: NarrationItem[]; approvedClips: number;
}
export interface Manifest {
  version: string; generatedAt: string;
  character: { front: string; side: string; seatedFront?: string; seatedSide?: string };
  voice: { id: string; model: string };
  movements: ManifestMovement[];
  narration: Record<string, NarrationItem>;
}

export const CONTENT_BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const contentUrl = (rel: string) => CONTENT_BASE + rel.replace(/^\//, '');

let cached: Promise<Manifest> | null = null;
export function loadManifest(): Promise<Manifest> {
  cached ??= fetch(contentUrl('manifest.json')).then(r => {
    if (!r.ok) throw new Error('המניפסט לא נטען');
    return r.json() as Promise<Manifest>;
  });
  return cached;
}

/** קליף מאושר לפי מזהה, או null. */
export function approvedClip(m: Manifest, clipId: string): ManifestClip | null {
  for (const mv of m.movements) for (const c of mv.clips) if (c.id === clipId && c.qa === 'approved' && c.url) return c;
  return null;
}
export function movementOf(m: Manifest, movementId: string): ManifestMovement | undefined {
  return m.movements.find(x => x.id === movementId);
}
