// שלב 2ב — סבב שני אחרי משוב "לא מספיק חם": קולות רכים מהספרייה + עיצוב קול לפי תיאור.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, config, api, logCost } from './lib.mjs';
import { tts, verify } from './04_narration.mjs';

const OUT = path.join(ROOT, 'outputs', 'stage2b'); fs.mkdirSync(OUT, { recursive: true });
const SENTENCE = 'שלום, וברוכים הבאים לטאי צ\'י 150. היום נתרגל ידיים כעננים. עומדים זקוף, הברכיים רכות, והנשימה איטית. כיסא או קיר בהישג יד.';
const report = [];

// (א) קולות ספרייה שמיועדים לרוך/מדיטציה — מזהים ציבוריים ידועים (אין voices_read במפתח)
const SOFT = { emily: 'LcfcDJNUP1GQjkzn1xUU', sarah: 'EXAVITQu4vr4xnSDxMaL', serena: 'pMsXgVXv3BLzUgSXRplE', grace: 'oWAxZDx7w5VEj9dCyTzz', dorothy: 'ThT5KcBeYPX3keUQqHPh' };
const settings = { ...config.tts.voice_settings, stability: 0.45, style: 0.2 };
for (const [name, voiceId] of Object.entries(SOFT)) {
  const label = `lib_${name}_v4`;
  try {
    const { file } = await tts({ text: SENTENCE, voiceId, modelId: 'eleven_v4', settings, label });
    const dest = path.join(OUT, `${label}.mp3`); fs.copyFileSync(file, dest);
    const v = await verify(dest, SENTENCE);
    report.push({ label, voiceId, match: Math.round(v.match * 100), heard: v.heard });
    console.log(`${label}: תמלול ${Math.round(v.match * 100)}% · ${v.heard}`);
  } catch (e) { console.error(`${label}: ${e.message.slice(0, 200)}`); report.push({ label, error: e.message.slice(0, 200) }); }
}

// (ב) עיצוב קול לפי תיאור — 3 תצוגות מקדימות לכל תיאור
const DESIGNS = {
  design_a: 'A warm, gentle woman in her early fifties speaking Israeli Hebrew. Soft, slightly low-pitched, velvety voice with a smile in it. Calm, reassuring and unhurried, like a kind yoga or tai chi teacher guiding beginners at home. Clear articulation, natural breathing, no breathiness, no theatrical drama.',
  design_b: 'A serene, maternal Hebrew-speaking woman around forty-five, soft mid-range voice, very warm and pleasant, slow and patient delivery, like a meditation guide. Rounded, soothing tone, gentle confidence, never rushed, never sharp.',
};
for (const [name, voice_description] of Object.entries(DESIGNS)) {
  try {
    const r = await api('/v1/text-to-voice/design?output_format=mp3_44100_128', { method: 'POST', body: { voice_description, text: SENTENCE, model_id: 'eleven_ttv_v3', guidance_scale: 4, loudness: 0.4 } });
    if (!r.ok) { const t = await r.text(); console.error(`${name}: ${r.status} ${t.slice(0, 300)}`); report.push({ label: name, error: `${r.status} ${t.slice(0, 200)}` }); continue; }
    const j = await r.json();
    logCost({ stage: 'narration', kind: 'voice-design', label: name, chars: SENTENCE.length, previews: j.previews.length, usd: null, note: 'מחויב לפי תווי טקסט התצוגה; מחיר מדויק לא מפורסם' });
    for (const [i, p] of j.previews.entries()) {
      const label = `${name}_${i + 1}`;
      const dest = path.join(OUT, `${label}.mp3`); fs.writeFileSync(dest, Buffer.from(p.audio_base_64, 'base64'));
      const v = await verify(dest, SENTENCE);
      report.push({ label, generated_voice_id: p.generated_voice_id, duration: p.duration_secs, match: Math.round(v.match * 100), heard: v.heard });
      console.log(`${label}: ${p.duration_secs?.toFixed(1)} ש' · תמלול ${Math.round(v.match * 100)}% · id ${p.generated_voice_id}`);
    }
  } catch (e) { console.error(`${name}: ${e.message.slice(0, 200)}`); }
}
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ sentence: SENTENCE, settings, designs: DESIGNS, report }, null, 2));
