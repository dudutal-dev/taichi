// שלב 2/3 — קליף לכל תנועה (image-to-video מתמונת הדמות).
// הרצה: node pipeline/02_clips.mjs <movementId> <front|side> [--model veo-3.1-generate-001]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, config, generate, imageRef, copyTo } from './lib.mjs';

const OUT = path.join(ROOT, 'outputs', 'stage3'); fs.mkdirSync(OUT, { recursive: true });

// מה שמשותף לכל קליף — הדרישות מהמסמך: עמידה גבוהה, מצלמה סטטית, לולאה.
const COMMON = {
  intro: 'The same woman from the reference image, in the same plain studio with the same clothes and lighting, demonstrates a Tai Chi movement for beginners aged 50+.',
  posture: 'High stance only: knees bent only slightly (no more than about 30 degrees), each knee stays above its own foot and never collapses inward, back upright and tall, shoulders relaxed and down, chin level, calm gentle face, natural breathing.',
  motion: 'Very slow, smooth, continuous motion at a relaxed teaching pace with no pauses and no sudden changes.',
  loop: 'She begins and ends in exactly the neutral standing posture of the reference image (feet shoulder-width apart, arms relaxed at the sides) so the clip loops seamlessly.',
  camera: 'Static locked camera, no camera movement, no zoom, no cuts, full body always in frame from head to feet, feet visible on the floor, background unchanged.',
  negative: 'deep squat, low stance, lunging, knees past toes, knees caving inward, leaning forward, jumping, fast or jerky motion, camera movement, zoom, cuts, scene change, extra people, text, captions, logos, watermark, distorted hands, extra fingers, blurry face, mirror, music',
};

export const MOVEMENTS = {
  cloud_hands: {
    nameHe: 'ידיים כעננים', pinyin: 'Yúnshǒu 云手', minWeek: 1, kneeLoad: 'low',
    front: 'Movement: Cloud Hands (Yun Shou), stationary version. Standing with feet parallel shoulder-width apart, she shifts her weight slowly from the right leg to the left leg and back, the waist turning gently with the weight so the torso faces slightly right, then slightly left. Both hands float in front of the body in slow vertical circles like drifting clouds: as the weight moves to one side, the hand on that side rises palm inward to face height while the other hand sinks to hip height, then they exchange. Elbows stay soft and slightly bent, hands never cross above the head and never drop behind the body. The feet stay planted, no stepping. Two full weight shifts in eight seconds.',
    side: 'Movement: Cloud Hands (Yun Shou), stationary version, seen in exact side profile from her right side. She shifts her weight slowly back and forth between the legs while the waist turns gently; both hands float in slow vertical circles in front of the chest and hips, palms inward, elbows soft. Her spine stays vertical throughout: no leaning forward or backward, the head stays above the pelvis. Feet planted, no stepping. Two full weight shifts in eight seconds.',
  },
  grasp_bird_tail: {
    nameHe: 'אחיזת זנב הציפור', pinyin: 'Lǎn Què Wěi 揽雀尾', minWeek: 2, kneeLoad: 'low-medium',
    front: 'Movement: Grasp the Bird\'s Tail (Lan Que Wei), simplified ward-off and press, performed slowly to the right side. She shifts her weight to the left leg, turns slightly right and steps the right foot a small step forward into a shallow bow stance with the right knee only slightly bent above the right foot. The right forearm rises rounded in front of the chest, palm inward (ward off), while the left palm follows behind it; then both hands press gently forward at chest height, and she sits back onto the left leg while the hands draw back toward the chest. She then returns the right foot beside the left and lowers the arms to the sides.',
    side: 'Movement: Grasp the Bird\'s Tail (Lan Que Wei), simplified ward-off and press, seen in exact side profile from her right side, moving toward the left edge of the frame. She steps the front foot a small step forward into a shallow bow stance, the front knee only slightly bent and staying above the front foot, the back leg nearly straight, spine vertical. The front forearm rises rounded at chest height (ward off), then both palms press gently forward, then she sits back onto the rear leg drawing the hands toward the chest, and finally brings the front foot back and lowers the arms.',
  },
  weight_shift: {
    nameHe: 'העברת משקל', pinyin: 'Qǐshì 起势 (בסיס)', minWeek: 1, kneeLoad: 'low',
    front: 'Movement: basic Tai Chi weight shifting with the opening posture. Standing with feet parallel shoulder-width apart, she slowly bends both knees a few degrees while the arms float up in front of the body to shoulder height, palms down, wrists relaxed; the arms then sink slowly back down to the hips as the knees soften. Then she shifts her weight slowly fully onto the right leg, pauses softly, shifts fully onto the left leg, and returns to center. Her head stays level, the hips move horizontally, the body does not bob up and down.',
    side: 'Movement: basic Tai Chi weight shifting with the opening posture, seen in exact side profile from her right side. The arms float slowly up in front of the body to shoulder height, palms down, then sink back to the hips while the knees soften a few degrees. Then the weight shifts slowly forward and back between the two feet with the spine vertical: no leaning, the head stays above the pelvis, the knees stay above the feet.',
  },
};

export function clipPrompt(id, view) {
  const m = MOVEMENTS[id];
  return [COMMON.intro, m[view], COMMON.posture, COMMON.motion, COMMON.loop, COMMON.camera].join(' ');
}

export async function makeClip(id, view, { model = config.video.model_id } = {}) {
  const ref = path.join(ROOT, 'content', 'character', `${view}.png`);
  const frame = imageRef(ref);
  const request = {
    model_id: model, prompt: clipPrompt(id, view), negative_prompt: COMMON.negative,
    duration_secs: config.video.duration_secs, aspect_ratio: '16:9', resolution: config.video.resolution,
    generate_audio: false, enhance_prompt: true, // Veo: אי אפשר לכבות (model_error 31.10)
    start_frame: frame, end_frame: frame,
  };
  const r = await generate('video', request, { ext: 'mp4', pollMs: 10000, stage: 3, label: `${id} ${view}` });
  const dest = copyTo(r.file, path.join(OUT, `${id}_${view}.mp4`));
  fs.writeFileSync(path.join(OUT, `${id}_${view}.prompt.json`), JSON.stringify({ ...request, start_frame: `<${ref}>`, end_frame: `<${ref}>`, generation_id: r.id, cache_key: r.key }, null, 2));
  return dest;
}

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  const [id, view = 'front'] = process.argv.slice(2);
  if (!MOVEMENTS[id]) { console.error('תנועות:', Object.keys(MOVEMENTS).join(', ')); process.exit(1); }
  console.log(await makeClip(id, view));
}
