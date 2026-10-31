// שלב 0 — בדיקת מפתח, הרשאות, ו-TTS עברי עם תמלול חזרה.
// הרצה: node pipeline/00_check.mjs   (קורא ELEVENLABS_API_KEY מ-.env)
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.env'), 'utf8')
  .split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const KEY = env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('אין ELEVENLABS_API_KEY ב-.env'); process.exit(1); }
const H = { 'xi-api-key': KEY };
const API = 'https://api.elevenlabs.io';
const out = path.join(root, 'outputs', 'stage0');
fs.mkdirSync(out, { recursive: true });

async function probe(name, url) {
  const r = await fetch(API + url, { headers: H });
  const t = await r.text();
  console.log(`\n[${name}] ${r.status}`);
  console.log(t.slice(0, 600));
  return { status: r.status, body: t };
}

const sub = await probe('subscription', '/v1/user/subscription');
await probe('models', '/v1/models');
await probe('voices', '/v1/voices?page_size=3');
// Image/Video API — שליחת בקשת list כדי לראות אם ה-endpoint פתוח (402 = צריך Pro)
await probe('flows-image-list', '/v1/flows/image');

const SENTENCE = 'עכשיו, ידיים כעננים. העבר את המשקל לאט לרגל ימין. הברך נשארת מעל כף הרגל.';
const VOICE = 'XrExE9yKIg1WjnnlVkGX'; // Matilda — 100% בתמלול ב-3.9
const wordsOf = s => s.replace(/[.,;:!?"'()\-–—]/g, ' ').split(/\s+/).filter(Boolean);

for (const model of ['eleven_v3', 'eleven_v4']) {
  const r = await fetch(`${API}/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: SENTENCE, model_id: model, language_code: 'he',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true, speed: 0.85 } })
  });
  console.log(`\n[tts ${model}] ${r.status}`);
  if (!r.ok) { console.log((await r.text()).slice(0, 600)); continue; }
  const buf = Buffer.from(await r.arrayBuffer());
  const f = path.join(out, `tts_${model}.mp3`);
  fs.writeFileSync(f, buf);
  console.log(`נשמר ${f} (${buf.length} bytes, ~${(buf.length * 8 / 128000).toFixed(1)} s)`);

  // תמלול חזרה
  const fd = new FormData();
  fd.append('file', new Blob([buf], { type: 'audio/mpeg' }), 'a.mp3');
  fd.append('model_id', 'scribe_v1');
  fd.append('language_code', 'heb');
  const s = await fetch(`${API}/v1/speech-to-text`, { method: 'POST', headers: H, body: fd });
  console.log(`[stt ${model}] ${s.status}`);
  const st = await s.text();
  if (!s.ok) { console.log(st.slice(0, 600)); continue; }
  const text = JSON.parse(st).text || '';
  const a = wordsOf(SENTENCE), b = new Set(wordsOf(text));
  const hit = a.filter(w => b.has(w)).length;
  console.log(`תמלול: ${text}`);
  console.log(`התאמת מילים: ${hit}/${a.length} = ${Math.round(100 * hit / a.length)}%`);
}
