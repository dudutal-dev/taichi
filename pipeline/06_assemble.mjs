// שלב ו — הרכבה: מעתיק לולאות מאושרות ל-content/video, סטילס קטנים ל-content/stills, מחבר קריינות, וכותב content/manifest.json.
// הרצה: node pipeline/06_assemble.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ROOT, config } from './lib.mjs';
import { KEYFRAME_CLIPS } from './02_clips.mjs';

const qa = JSON.parse(fs.readFileSync(path.join(ROOT, 'pipeline', 'qa_status.json'), 'utf8'));
const nar = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'audio', 'narration', 'index.json'), 'utf8'));
const VIDEO = path.join(ROOT, 'content', 'video'); fs.mkdirSync(VIDEO, { recursive: true });
const STILLS = path.join(ROOT, 'content', 'stills'); fs.mkdirSync(STILLS, { recursive: true });
const KF = path.join(ROOT, 'outputs', 'stage3', 'keyframes');
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 16);

// ספריית התנועות: שם, פיניין, מסלול, שבוע כניסה, עומס ברך, 3 נקודות טכניקה.
const MOVEMENTS = {
  warmup:            { nameHe: 'חימום', pinyin: '', track: 'main', minWeek: 1, kneeLoad: 'low', skippable: false, tips: ['ליד הכיסא', 'כיפוף ברך קטן בלבד', 'לא לדלג בשבועות 1–4'] },
  opening:           { nameHe: 'עמידת פתיחה, העברת משקל', pinyin: 'Qǐshì 起势', track: 'main', minWeek: 1, kneeLoad: 'low', tips: ['רגליים ברוחב הכתפיים', 'הראש באותו גובה', 'האגן זז הצידה, לא למטה'] },
  cloud_hands:       { nameHe: 'ידיים כעננים', pinyin: 'Yúnshǒu 云手', track: 'main', minWeek: 1, kneeLoad: 'low', tips: ['המשקל עובר לפני היד', 'כף היד פונה לפנים', 'הרגליים במקום בשבועות 1–2'] },
  grasp_bird_tail:   { nameHe: 'אחיזת זנב הציפור', pinyin: 'Lǎn Què Wěi 揽雀尾', track: 'main', minWeek: 2, kneeLoad: 'low-medium', tips: ['צעד קטן, חצי כף רגל', 'הברך הקדמית מעל כף הרגל', 'ארבעה חלקים: הדיפה, משיכה, לחיצה, דחיפה'] },
  cross_hands:       { nameHe: 'ידיים צולבות', pinyin: 'Shízì Shǒu 十字手', track: 'main', minWeek: 2, kneeLoad: 'low', tips: ['פרקי הידיים בגובה עצם הבריח', 'המרפקים רכים', 'הכתפיים למטה'] },
  brush_knee:        { nameHe: 'ליטוף הברך וצעד', pinyin: 'Lōu Xī Ào Bù 搂膝拗步', track: 'main', minWeek: 3, kneeLoad: 'medium', tips: ['צעד קטן', 'היד הדוחפת בגובה הכתף', 'העקב האחורי על הרצפה'] },
  golden_rooster:    { nameHe: 'תרנגול הזהב על רגל אחת', pinyin: 'Jīn Jī Dú Lì 金鸡独立', track: 'main', minWeek: 4, kneeLoad: 'medium', tips: ['יד על הכיסא', 'הברך עולה נמוך, קדימה', 'הגב ישר, הראש מעל האגן'] },
  wild_horse:        { nameHe: 'פיצול רעמת הסוס הפראי', pinyin: 'Yě Mǎ Fēn Zōng 野马分鬃', track: 'main', minWeek: 5, kneeLoad: 'high', tips: ['עמידה גבוהה בלבד', 'צעד קטן', 'יד אחת עולה, השנייה יורדת'] },
  repulse_monkey:    { nameHe: 'הדיפת הקוף', pinyin: 'Dào Juǎn Gōng 倒卷肱', track: 'main', minWeek: 5, kneeLoad: 'high', tips: ['צעד קטן אחורה, בהונות קודם', 'היד דוחפת בגובה הכתף', 'הגב ישר'] },
  heel_kick:         { nameHe: 'בעיטת עקב', pinyin: 'Dēng Jiǎo 蹬脚', track: 'main', minWeek: 7, kneeLoad: 'medium', tips: ['ליד כיסא', 'העקב מוביל, נמוך', 'לא נשענים אחורה'] },
  closing:           { nameHe: 'סיום', pinyin: 'Shōushì 收势', track: 'main', minWeek: 1, kneeLoad: 'low', tips: ['לוחצים את האוויר למטה', 'שלוש נשימות', 'לסיים בשקט'] },
  white_crane:       { nameHe: 'העגור הלבן פורש כנפיים', pinyin: 'Báihè Liàngchì 白鹤亮翅', track: 'main', minWeek: 10, kneeLoad: 'low', tips: ['המשקל על הרגל האחורית', 'הרגל הקדמית נוגעת בבהונות', 'יד אחת עולה, אחת יורדת'] },
  play_pipa:         { nameHe: 'נגינה בפיפה', pinyin: 'Shǒuhūi Pípá 手挥琵琶', track: 'main', minWeek: 10, kneeLoad: 'low', tips: ['העקב הקדמי על הרצפה', 'כמו מחזיקים כלי מיתר', 'המרפקים רכים'] },
  single_whip:       { nameHe: 'שוט יחיד', pinyin: 'Dān Biān 单鞭', track: 'main', minWeek: 10, kneeLoad: 'medium', tips: ['צעד קטן', 'האצבעות מתכנסות למטה', 'העיניים אחרי היד הדוחפת'] },
  high_pat_horse:    { nameHe: 'טפיחה גבוהה על הסוס', pinyin: 'Gāo Tàn Mǎ 高探马', track: 'main', minWeek: 11, kneeLoad: 'low', tips: ['המשקל אחורה', 'כף היד בגובה הפנים', 'היד השנייה כף למעלה'] },
  strike_ears:       { nameHe: 'מכה לאוזניים בשני אגרופים', pinyin: 'Shuāngfēng Guàn-ěr 双峰贯耳', track: 'main', minWeek: 12, kneeLoad: 'medium', tips: ['אגרופים רפויים', 'בלי כוח', 'המרפקים מעוגלים'] },
  shuttle:           { nameHe: 'העלמה אורגת במנול', pinyin: 'Yùnǚ Chuānsuō 玉女穿梭', track: 'main', minWeek: 12, kneeLoad: 'medium', tips: ['יד מעל המצח, כף החוצה', 'השנייה דוחפת בגובה החזה', 'צעד קטן'] },
  needle_sea_bottom: { nameHe: 'מחט בקרקעית הים', pinyin: 'Hǎidǐ Zhēn 海底针', track: 'main', minWeek: 11, kneeLoad: 'low', tips: ['הגב נשאר ארוך', 'מתכופפים רק מעט מהירכיים', 'לא לעומק'] },
  fan_through_back:  { nameHe: 'מניפה דרך הגב', pinyin: 'Shān Tōng Bèi 扇通背', track: 'main', minWeek: 11, kneeLoad: 'low', tips: ['יד ליד הרקה, כף החוצה', 'השנייה דוחפת קדימה', 'צעד קטן'] },
  parry_punch:       { nameHe: 'הסטה, חסימה ואגרוף', pinyin: 'Bānlánchuí 搬拦捶', track: 'main', minWeek: 12, kneeLoad: 'medium', tips: ['קודם הכף, אחר כך האגרוף', 'לא לנעול את המרפק', 'לאט, בלי כוח'] },
  apparent_close:    { nameHe: 'סגירה לכאורה', pinyin: 'Rúfēng Sìbì 如封似闭', track: 'main', minWeek: 12, kneeLoad: 'low', tips: ['שתי הכפות קדימה', 'כמו סוגרים דלת', 'המשקל לרגל הקדמית'] },
  bdj_heaven:   { nameHe: 'שתי ידיים תומכות בשמיים', pinyin: 'Shuāng Shǒu Tuō Tiān', track: 'seated', minWeek: 1, kneeLoad: 'low', tips: ['אצבעות משולבות', 'כפות הידיים למעלה', 'הכתפיים למטה'] },
  bdj_bow:      { nameHe: 'משיכת הקשת', pinyin: '', track: 'seated', minWeek: 1, kneeLoad: 'low', tips: ['האצבע מורה למעלה', 'מביטים לאורך היד', 'החזה נפתח'] },
  bdj_separate: { nameHe: 'הפרדת שמיים וארץ', pinyin: '', track: 'seated', minWeek: 1, kneeLoad: 'low', tips: ['יד אחת למעלה כף למעלה', 'השנייה למטה כף למטה', 'הגב זקוף'] },
  bdj_lookback: { nameHe: 'הינשוף מביט לאחור', pinyin: '', track: 'seated', minWeek: 1, kneeLoad: 'low', tips: ['הידיים על הירכיים', 'סיבוב איטי', 'האגן נשאר על הכיסא'] },
  bdj_sway:     { nameHe: 'נענוע הראש והזנב', pinyin: '', track: 'seated', minWeek: 1, kneeLoad: 'low', tips: ['המרפקים החוצה', 'הטיה מהמותניים', 'הראש הולך עם הגו'] },
  bdj_feet:     { nameHe: 'אחיזת כפות הרגליים', pinyin: '', track: 'seated', minWeek: 1, kneeLoad: 'low', tips: ['מהירכיים, הגב ארוך', 'עד איפה שנוח', 'עולים לאט'] },
  bdj_fists:    { nameHe: 'אגרופים ומבט', pinyin: '', track: 'seated', minWeek: 1, kneeLoad: 'low', tips: ['אגרוף רפוי', 'לא לנעול את המרפק', 'העיניים קדימה'] },
  bdj_heels:    { nameHe: 'עליות על העקבים', pinyin: '', track: 'seated', minWeek: 1, kneeLoad: 'low', tips: ['רק הבהונות על הרצפה', 'מורידים ברכות', 'שבע פעמים'] },
  weight_shift: { alias: 'opening' },
};

/** סטיל קטן (JPEG 960px) מתמונת-מפתח — לפריטי "סטיל + קריינות" ולספרייה. */
function still(k) {
  const src = path.join(KF, `${k}.png`); if (!fs.existsSync(src)) return null;
  const dest = path.join(STILLS, `${k}.jpg`);
  if (!fs.existsSync(dest) || fs.statSync(dest).mtimeMs < fs.statSync(src).mtimeMs) execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', 'scale=960:-2', '-q:v', '4', dest]);
  return `stills/${k}.jpg`;
}

const manifest = { version: '4b', generatedAt: new Date().toISOString().slice(0, 10), character: { front: 'content/character/front.png', side: 'content/character/side.png', seatedFront: still('seated_front') ?? '', seatedSide: still('seated_side') ?? '' }, voice: { id: config.tts.voice_id, model: config.tts.model_id }, movements: [], narration: {}, audio: {} };

const byMovement = {};
for (const [id, c] of Object.entries(KEYFRAME_CLIPS)) {
  if (id.endsWith('_OLD')) continue;
  const mv = MOVEMENTS[c.movement]?.alias || c.movement;
  const st = qa[id] || { qa: 'pending', note: 'אין רשומת QA' };
  const src = path.join(ROOT, 'outputs', 'stage3', `${id}_kf.mp4`);
  const loop = path.join(ROOT, 'outputs', 'stage3', 'loops', `${id}_loop.mp4`);
  const entry = { id, view: c.view, method: 'keyframe', durationMs: 4000, loop: 'pingpong', qa: st.qa, qaNote: st.note || '', attempt: st.attempt || 1, keyframe: `outputs/stage3/keyframes/${c.end || id}.png`, still: still(c.end || id) };
  if (c.start) entry.startKeyframe = `outputs/stage3/keyframes/${c.start}.png`;
  if (st.qa === 'approved' && fs.existsSync(loop)) {
    const dest = path.join(VIDEO, `${id}.mp4`); fs.copyFileSync(loop, dest);
    entry.url = `video/${id}.mp4`; entry.loopDurationMs = 8000; entry.hash = sha(dest); entry.bytes = fs.statSync(dest).size;
  } else if (fs.existsSync(src)) { entry.source = `outputs/stage3/${id}_kf.mp4`; }
  (byMovement[mv] ||= []).push(entry);
}
// תנועות שיש להן רק סטיל (בלי קליף): עקבים בישיבה
for (const [mid, k] of [['bdj_heels', 'bdj_heels_side']]) {
  (byMovement[mid] ||= []).push({ id: k, view: 'side', method: 'still', durationMs: 0, qa: 'still', qaNote: 'סטיל + קריינות (הקליף לא שכנע)', still: still(k) });
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
console.log(`content/video: ${fs.readdirSync(VIDEO).filter(f => f.endsWith('.mp4')).length} קבצים, ${(fs.readdirSync(VIDEO).reduce((a, f) => a + fs.statSync(path.join(VIDEO, f)).size, 0) / 1e6).toFixed(0)}MB · stills: ${fs.readdirSync(STILLS).length}`);
