// Dexie / IndexedDB — כל הנתונים מקומיים. אין שרת, אין חשבון, אין טלמטריה. (סעיף 10 במסמך)
import Dexie, { type EntityTable } from 'dexie';

export type Track = 'main' | 'joints' | 'seated';
export type SessionStatus = 'done' | 'partial' | 'stopped';

export interface Profile {
  id: number;
  name: string;
  track: Track;
  voiceId: string;
  reminderDays: number[];
  reminderTime: string;
  screening: Record<string, boolean>;
  startDate: string; // ISO yyyy-mm-dd — תחילת שבוע 1
  createdAt: string;
}
export interface SessionRow {
  id?: number;
  date: string; // ISO yyyy-mm-dd
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
    this.version(1).stores({
      profile: 'id',
      sessions: '++id, date, week, status',
      measurements: '++id, week, date',
      weeks: 'weekNo',
      messages: 'id, week',
      settings: 'id',
    });
  }
}
export const db = new TaiChiDB();

export const DEFAULT_SETTINGS: Settings = { id: 1, music: 'ambient', breathCue: 'words', mirror: true, fontScale: 'normal', darkMode: 'auto', natureSound: 'forest' };

export function todayISO(d = new Date()): string {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

/** פרופיל ברירת מחדל לשלב 5 (הפתיחה המודרכת תגיע בשלב 6). */
export async function ensureProfile(): Promise<Profile> {
  const p = await db.profile.get(1);
  if (p) return p;
  const fresh: Profile = { id: 1, name: '', track: 'main', voiceId: '', reminderDays: [0, 1, 2, 3, 4], reminderTime: '08:00', screening: {}, startDate: todayISO(), createdAt: new Date().toISOString() };
  await db.profile.put(fresh);
  await db.settings.put(DEFAULT_SETTINGS);
  return fresh;
}
export async function getSettings(): Promise<Settings> {
  return (await db.settings.get(1)) ?? DEFAULT_SETTINGS;
}
