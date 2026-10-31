// שלב 1 — תמונות ייחוס של הדמות המדגימה.
// הרצה: node pipeline/01_character.mjs            → 4 מועמדות, מבט חזיתי, outputs/stage1/
//        node pipeline/01_character.mjs side <N>   → מבט צד למועמדת N (אחרי בחירת דודו)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, config, generate, imageRef, copyTo } from './lib.mjs';

const OUT = path.join(ROOT, 'outputs', 'stage1');
fs.mkdirSync(OUT, { recursive: true });

// בסיס משותף לכל התמונות — מה שהווידאו צריך: גוף מלא, רקע נייטרלי, בלי טקסט.
const BASE = [
  'Photorealistic full-body photograph of a single beautiful, elegant woman, about 40 years old, graceful, fit and calm, natural beauty, minimal natural makeup,',
  'standing in a Tai Chi opening stance: feet shoulder-width apart, knees very slightly bent (upright, high stance),',
  'back straight, shoulders relaxed, arms hanging loosely at the sides, palms facing the thighs, gentle neutral expression.',
  'Plain solid-color practice clothes with no logos, no patterns, no text: {clothes}. Flat soft-soled shoes.',
  'Neutral light studio background, plain light warm-grey wall and floor, even soft diffused lighting, no shadows on the wall.',
  'Entire body visible from head to feet with margin above and below, camera at chest height, {view}.',
  'No text, no watermark, no logos, no props, no other people.',
].join(' ');

const CANDIDATES = [
  { n: 1, who: 'long dark-brown hair in a low ponytail, light olive skin, slim graceful build', clothes: 'a soft sage-green long-sleeve top and loose dark-grey trousers' },
  { n: 2, who: 'shoulder-length honey-blonde hair, fair skin, slim athletic build', clothes: 'a cream long-sleeve top and loose charcoal trousers' },
  { n: 3, who: 'black hair tied in a neat low bun, medium-brown skin, elegant toned build', clothes: 'a muted terracotta long-sleeve top and loose black trousers' },
  { n: 4, who: 'wavy auburn hair just past the shoulders, light skin with freckles, slim build', clothes: 'a dusty-blue long-sleeve top and loose dark-grey trousers' },
];

const VIEWS = {
  front: 'frontal view, the woman faces the camera directly',
  side: 'exact side profile view from her right side, she faces the left edge of the frame, same woman, same clothes, same studio, same lighting',
};

function prompt(c, view) {
  return BASE.replace('{clothes}', c.clothes).replace('{view}', VIEWS[view]).replace('a single woman,', `a single woman with ${c.who},`);
}

async function makeImage(c, view, refFile) {
  const request = { model_id: config.image.model_id, prompt: prompt(c, view), aspect_ratio: '16:9', resolution: config.image.resolution };
  if (refFile) request.images = [imageRef(refFile)];
  const r = await generate('image', request, { ext: 'png', pollMs: 3000, stage: 1, label: `character ${c.n} ${view}` });
  return copyTo(r.file, path.join(OUT, `candidate_${c.n}_${view}.png`));
}

const [mode, which] = process.argv.slice(2);
if (mode === 'side') {
  const c = CANDIDATES.find(x => x.n === Number(which));
  if (!c) throw new Error('מספר מועמדת לא תקין');
  const front = path.join(OUT, `candidate_${c.n}_front.png`);
  if (!fs.existsSync(front)) throw new Error(`חסר ${front}`);
  console.log(await makeImage(c, 'side', front));
} else {
  const files = await Promise.all(CANDIDATES.map(c => makeImage(c, 'front').catch(e => { console.error(`מועמדת ${c.n}: ${e.message}`); return null; })));
  fs.writeFileSync(path.join(OUT, 'prompts.json'), JSON.stringify(CANDIDATES.map(c => ({ ...c, prompt: prompt(c, 'front') })), null, 2));
  console.log('\nתוצאות:'); files.forEach(f => console.log(' ', f));
}
