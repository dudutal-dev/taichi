// שמירת קול מעוצב לחשבון + בדיקת TTS עם המזהה הקבוע. הרצה: node pipeline/04c_save_voice.mjs <generated_voice_id> <label>
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, config, api, logCost } from './lib.mjs';
import { tts, verify } from './04_narration.mjs';

const [generated_voice_id, label] = process.argv.slice(2);
const rep = JSON.parse(fs.readFileSync(path.join(ROOT, 'outputs', 'stage2b', 'report.json'), 'utf8'));
const desc = rep.designs[label.replace(/_\d$/, '')];
const r = await api('/v1/text-to-voice', { method: 'POST', body: { voice_name: 'TaiChi150 — קריינית', voice_description: desc, generated_voice_id, labels: { language: 'he', use_case: 'narration', project: 'taichi150' } } });
const t = await r.text();
if (!r.ok) { console.error(`save ${r.status}: ${t.slice(0, 400)}`); process.exit(1); }
const voice_id = JSON.parse(t).voice_id;
console.log('voice_id:', voice_id);
logCost({ stage: 'narration', kind: 'voice-save', label, voice_id, usd: 0, note: 'שמירת קול מעוצב — תופס מקום ברשימת הקולות' });

const cfgPath = path.join(ROOT, 'pipeline', 'config.json');
config.tts.voice_id = voice_id;
config.tts.voice_name = 'TaiChi150 — קריינית (design ' + label + ')';
config.tts.voice_settings = { stability: 0.5, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true };
config.tts.chosen_at = '2026-10-31';
fs.writeFileSync(cfgPath, JSON.stringify(config, null, 2));

const SENTENCE = rep.sentence;
const OUT = path.join(ROOT, 'outputs', 'stage2b');
for (const modelId of ['eleven_v4', 'eleven_v3']) {
  const { file } = await tts({ text: SENTENCE, voiceId: voice_id, modelId, settings: config.tts.voice_settings, label: `saved_${modelId}` });
  const dest = path.join(OUT, `chosen_${label}_${modelId}.mp3`); fs.copyFileSync(file, dest);
  const v = await verify(dest, SENTENCE);
  console.log(`${modelId}: ${(fs.statSync(dest).size * 8 / 128000).toFixed(1)} ש' · תמלול ${Math.round(v.match * 100)}%`);
}
