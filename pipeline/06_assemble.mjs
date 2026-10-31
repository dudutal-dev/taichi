// שלב ו — הרכבה: מעתיק לולאות מאושרות ל-content/video, מחבר קריינות, וכותב content/manifest.json.
// הרצה: node pipeline/06_assemble.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, config } from './lib.mjs';
import { KEYFRAME_CLIPS } from './02_clips.mjs';

const qa = JSON.parse(fs.readFileSync(path.join(ROOT, 'pipeline', 'qa_status.json'), 'utf8'));
const nar = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'audio', 'narration', 'index.json'), 'utf8'));
const VIDEO = path.join(ROOT, 'content', 'video'); fs.mkdirSync(VIDEO, { recursive: true });
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 16);

// ספריית התנועות (שבועות 1–4 + מה שהוגדר); השאר יתווסף בשלב 4ב מתוך content/forms.
const MOVEMENTS = {
  warmup:          { nameHe: 'חימום', pinyin: '', track: 'main', minWeek: 1, kneeLoad: 'low', skippable: false, tips: ['ליד הכיסא', 'כיפוף ברך קטן בלבד', 'לא לדלג בשבועות 1–4'] },
  opening:         { nameHe: 'עמידת פתיחה, העברת משקל', pinyin: 'Qǐshì 起势', track: 'main', minWeek: 1, kneeLoad: 'low', tips: ['רגליים ברוחב הכתפיים', 'הראש באותו גובה', 'האגן זז הצידה, לא למטה'], clipIds: ['weight_shift_front_arms_mid', 'weight_shift_front_arms', 'weight_shift_side_arms', 'weight_shift_front_right', 'weight_shift_front_left'] },
  cloud_hands:     { nameHe: 'ידיים כעננים', pinyin: 'Yúnshǒu 云手', track: 'main', minWeek: 1, kneeLoad: 'low', tips: ['המשקל עובר לפני היד', 'כף היד פונה לפנים', 'הרגליים במקום בשבועות 1–2'] },
  grasp_bird_tail: { nameHe: 'אחיזת זנב הציפור', pinyin: 'Lǎn Què Wěi 揽雀尾', track: 'main', minWeek: 2, kneeLoad: 'low-medium', tips: ['צעד קטן, חצי כף רגל', 'הברך הקדמית מעל כף הרגל', 'ארבעה חלקים: הדיפה, משיכה, לחיצה, דחיפה'] },
  cross_hands:     { nameHe: 'ידיים צולבות', pinyin: 'Shízì Shǒu 十字手', track: 'main', minWeek: 2, kneeLoad: 'low', tips: ['פרקי הידיים בגובה עצם הבריח', 'המרפקים רכים', 'הכתפיים למטה'] },
  brush_knee:      { nameHe: 'ליטוף הברך וצעד', pinyin: 'Lōu Xī Ào Bù 搂膝拗步', track: 'main', minWeek: 3, kneeLoad: 'medium', tips: ['צעד קטן', 'היד הדוחפת בגובה הכתף', 'העקב האחורי על הרצפה'] },
  closing:         { nameHe: 'סיום', pinyin: 'Shōushì 收势', track: 'main', minWeek: 1, kneeLoad: 'low', tips: ['לוחצים את האוויר למטה', 'שלוש נשימות', 'לסיים בשקט'] },
  weight_shift:    { alias: 'opening' },
};

const manifest = { version: '4a', generatedAt: new Date().toISOString().slice(0, 10), character: { front: 'content/character/front.png', side: 'content/character/side.png' }, voice: { id: config.tts.voice_id, model: config.tts.model_id }, movements: [], narration: {}, audio: {} };

const byMovement = {};
for (const [id, c] of Object.entries(KEYFRAME_CLIPS)) {
  if (id.endsWith('_OLD')) continue;
  const mv = MOVEMENTS[c.movement]?.alias || c.movement;
  const st = qa[id] || { qa: 'pending', note: 'אין רשומת QA' };
  const src = path.join(ROOT, 'outputs', 'stage3', `${id}_kf.mp4`);
  const loop = path.join(ROOT, 'outputs', 'stage3', 'loops', `${id}_loop.mp4`);
  const entry = { id, view: c.view, method: 'keyframe', durationMs: 4000, loop: 'pingpong', qa: st.qa, qaNote: st.note || '', attempt: st.attempt || 1, keyframe: `outputs/stage3/keyframes/${c.end || id}.png` };
  if (c.start) entry.startKeyframe = `outputs/stage3/keyframes/${c.start}.png`;
  if (st.qa === 'approved' && fs.existsSync(loop)) {
    const dest = path.join(VIDEO, `${id}.mp4`); fs.copyFileSync(loop, dest);
    entry.url = `video/${id}.mp4`; entry.loopDurationMs = 8000; entry.hash = sha(dest); entry.bytes = fs.statSync(dest).size;
  } else if (fs.existsSync(src)) { entry.source = `outputs/stage3/${id}_kf.mp4`; }
  (byMovement[mv] ||= []).push(entry);
}
for (const [mid, m] of Object.entries(MOVEMENTS)) {
  if (m.alias) continue;
  const clips = byMovement[mid] || [];
  const cues = Object.entries(nar).filter(([k]) => k.startsWith(mid + '_') || k === mid).map(([k, v]) => ({ id: k, url: `audio/narration/${k}.mp3`, durationMs: v.durationMs, text: v.text, qa: v.qa }));
  manifest.movements.push({ id: mid, ...m, clips, narration: cues, approvedClips: clips.filter(c => c.qa === 'approved').length });
}
for (const [k, v] of Object.entries(nar)) manifest.narration[k] = { url: `audio/narration/${k}.mp3`, durationMs: v.durationMs, text: v.text, qa: v.qa };
fs.writeFileSync(path.join(ROOT, 'content', 'manifest.json'), JSON.stringify(manifest, null, 2));

const total = Object.values(byMovement).flat();
console.log(`מניפסט: ${manifest.movements.length} תנועות · ${total.length} קליפים (${total.filter(c => c.qa === 'approved').length} approved, ${total.filter(c => c.qa === 'pending').length} pending, ${total.filter(c => c.qa === 'rejected').length} rejected) · ${Object.keys(nar).length} קטעי קריינות`);
console.log(`content/video: ${fs.readdirSync(VIDEO).filter(f => f.endsWith('.mp4')).length} קבצים, ${(fs.readdirSync(VIDEO).reduce((a, f) => a + fs.statSync(path.join(VIDEO, f)).size, 0) / 1e6).toFixed(0)}MB`);
