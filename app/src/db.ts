// Dexie / IndexedDB — כל הנתונים מקומיים. אין שרת, אין חשבון, אין טלמטריה. (סעיף 10 במסמך)
import Dexie, { type EntityTable } from 'dexie';

export type Track = 'main' | 'joints' | 'seated';
export type SessionStatus = 'done' | 'partial' | 'stopped';

export interface Profile {
  id: number;
  name: string;
  track: Track;
  voiceId: string;
  reminderDays: number[];     // 0=ראשון … 6=שבת
  reminderTime: string;       // "08:00"
  screening: Record<string, boolean>;
  startDate: string;          // ISO yyyy-mm-dd — תחילת שבוע 1
  createdAt: string;
  onboarded: boolean;
  nearChair: boolean;
  skipTurnsAndKicks: boolean;
  maxSessionMinWeeks1to4: number | null;
  suspendBalanceUntil: string | null;
  suggestSeatedNext: boolean;
}
export interface SessionRow {
  id?: number;
  date: string;
  week: number;
  dayInWeek: number;
  track: Track;
  plannedMin: number;
  actualMin: number;
  status: SessionStatus;
  movements: string[];
  painKnee: boolean;
  painBack: boolean;
  dizzy: boolean;
  mood: 1 | 2 | 3 | null;
  notes?: string;
}
export interface Measurement {
  id?: number; date: string; week: 0 | 6 | 12 | 24;
  singleLegL?: number; singleLegR?: number; sitToStand30?: number; tug?: number;
  bpSys?: number; bpDia?: number; sleep1to5?: number; mood1to5?: number;
}
export interface WeekRow { weekNo: number; startDate: string; walks: number; strength: number; }
export interface MessageRow { id: string; week: number; audioUrl: string; textHe: string; playedAt?: string; }
export interface Settings {
  id: number;
  music: 'ambient' | 'nature' | 'off';
  breathCue: 'words' | 'tone' | 'off';
  mirror: boolean;
  fontScale: 'normal' | 'large' | 'xl';
  darkMode: 'auto' | 'light' | 'dark';
  natureSound: 'forest' | 'stream' | 'wind';
}

export class TaiChiDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>;
  sessions!: EntityTable<SessionRow, 'id'>;
  measurements!: EntityTable<Measurement, 'id'>;
  weeks!: EntityTable<WeekRow, 'weekNo'>;
  messages!: EntityTable<MessageRow, 'id'>;
  settings!: EntityTable<Settings, 'id'>;
  constructor() {
    super('taichi150');
    this.version(1).stores({ profile: 'id', sessions: '++id, date, week, status', measurements: '++id, week, date', weeks: 'weekNo', messages: 'id, week', settings: 'id' });
    this.version(2).stores({ profile: 'id', sessions: '++id, date, week, status', measurements: '++id, week, date', weeks: 'weekNo', messages: 'id, week', settings: 'id' })
      .upgrade(tx => tx.table('profile').toCollection().modify((p: Partial<Profile>) => {
        p.onboarded ??= true; p.nearChair ??= false; p.skipTurnsAndKicks ??= false; p.maxSessionMinWeeks1to4 ??= null; p.suspendBalanceUntil ??= null; p.suggestSeatedNext ??= false;
      }));
  }
}
export const db = new TaiChiDB();

export const DEFAULT_SETTINGS: Settings = { id: 1, music: 'ambient', breathCue: 'words', mirror: true, fontScale: 'normal', darkMode: 'auto', natureSound: 'forest' };

export function todayISO(d = new Date()): string {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

export function blankProfile(): Profile {
  return { id: 1, name: '', track: 'main', voiceId: '', reminderDays: [0, 1, 2, 3, 4], reminderTime: '08:00', screening: {}, startDate: todayISO(), createdAt: new Date().toISOString(), onboarded: false, nearChair: false, skipTurnsAndKicks: false, maxSessionMinWeeks1to4: null, suspendBalanceUntil: null, suggestSeatedNext: false };
}
/** מחזיר את הפרופיל, או null אם עדיין לא עברו את הפתיחה. */
export async function getProfile(): Promise<Profile | null> {
  return (await db.profile.get(1)) ?? null;
}
export async function getSettings(): Promise<Settings> {
  return (await db.settings.get(1)) ?? DEFAULT_SETTINGS;
}
export function applyDisplaySettings(s: Settings) {
  document.documentElement.dataset.font = s.fontScale;
  if (s.darkMode !== 'auto') document.documentElement.dataset.theme = s.darkMode; else delete document.documentElement.dataset.theme;
}

/** ייצוא כל הנתונים ל-JSON (גיבוי ידני) וייבוא. */
export async function exportAll(): Promise<string> {
  const data = { exportedAt: new Date().toISOString(), profile: await db.profile.toArray(), sessions: await db.sessions.toArray(), measurements: await db.measurements.toArray(), weeks: await db.weeks.toArray(), messages: await db.messages.toArray(), settings: await db.settings.toArray() };
  return JSON.stringify(data, null, 2);
}
export async function importAll(json: string): Promise<void> {
  const d = JSON.parse(json) as Partial<Record<'profile' | 'sessions' | 'measurements' | 'weeks' | 'messages' | 'settings', unknown[]>>;
  await db.transaction('rw', [db.profile, db.sessions, db.measurements, db.weeks, db.messages, db.settings], async () => {
    for (const t of ['profile', 'sessions', 'measurements', 'weeks', 'messages', 'settings'] as const) {
      await db.table(t).clear();
      if (Array.isArray(d[t])) await db.table(t).bulkPut(d[t] as object[]);
    }
  });
}
export async function resetAll(): Promise<void> {
  await db.delete(); await db.open();
}
