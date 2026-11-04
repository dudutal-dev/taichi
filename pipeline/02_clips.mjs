// שלב 2/3 — קליף לכל תנועה (image-to-video מתמונת הדמות).
// הרצה: node pipeline/02_clips.mjs <movementId> <front|side> [--model veo-3.1-generate-001]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, config, generate, imageRef, copyTo } from './lib.mjs';
import { KEYFRAME_CLIPS_4A, KEYFRAME_CLIPS_REDO } from './clips_4a.mjs';
import { KEYFRAME_CLIPS_4B } from './clips_4b.mjs';
import { KEYFRAME_CLIPS_TCA } from './clips_tca.mjs';

const OUT = path.join(ROOT, 'outputs', 'stage3'); fs.mkdirSync(OUT, { recursive: true });

// מה שמשותף לכל קליף — הדרישות מהמסמך: עמידה גבוהה, מצלמה סטטית, לולאה.
export const PROMPT_VERSION = 2; // v2 (31.10): מסגור תרפיה עדינה, רגליים דבוקות, בלי לאנג'/סקוואט/צעד
const COMMON = {
  intro: 'Gentle, slow movement therapy for seniors at home, NOT martial arts and NOT a workout. The same woman from the reference image, in the same plain studio with the same clothes and lighting, demonstrates one simple Tai Chi movement at beginner level.',
  posture: 'She stays TALL the whole time: her hips remain high, her knees are only softly unlocked (a slight bend of a few degrees, never a squat, never a lunge, never a deep stance), each knee stays above its own foot, the back heels stay on the floor, the spine is vertical, shoulders relaxed, chin level, calm gentle face, natural breathing.',
  motion: 'Everything is very slow, smooth and continuous, like a gentle sway, with no pauses and no sudden changes. The range of motion is small and comfortable.',
  loop: 'She begins and ends in exactly the neutral standing posture of the reference image (feet shoulder-width apart, arms relaxed at the sides) so the clip loops seamlessly.',
  camera: 'Static locked camera, no camera movement, no zoom, no cuts, full body always in frame from head to feet, feet visible on the floor, background unchanged.',
  negative: 'squat, deep squat, lunge, horse stance, bow stance, low stance, bent knees, knees past toes, knees caving inward, heel lifting, stepping, walking, leaning forward, jumping, fast or jerky motion, martial arts, kung fu, camera movement, zoom, cuts, scene change, extra people, text, captions, logos, watermark, distorted hands, extra fingers, blurry face, mirror, music',
};

export const MOVEMENTS = {
  cloud_hands: {
    nameHe: 'ידיים כעננים', pinyin: 'Yúnshǒu 云手', minWeek: 1, kneeLoad: 'low', durationSecs: 6,
    front: 'Movement: Cloud Hands (Yun Shou), stationary version. Standing with feet parallel shoulder-width apart, she shifts her weight slowly from the right leg to the left leg and back, the waist turning gently with the weight so the torso faces slightly right, then slightly left. Both hands float in front of the body in slow vertical circles like drifting clouds: as the weight moves to one side, the hand on that side rises palm inward to face height while the other hand sinks to hip height, then they exchange. Elbows stay soft and slightly bent, hands never cross above the head and never drop behind the body. The feet stay planted, no stepping. Two full weight shifts in eight seconds.',
    side: 'Movement: Cloud Hands (Yun Shou), stationary version, seen in exact side profile from her right side. BOTH FEET STAY GLUED TO THE FLOOR for the entire clip: no step, no lunge. Standing tall, she only sways her weight gently from one leg to the other while the waist turns slightly; both hands float in slow small vertical circles in front of the chest and belly, palms toward her body, elbows soft and close to the ribs. Her spine stays vertical, the head stays above the pelvis.',
  },
  grasp_bird_tail: {
    nameHe: 'אחיזת זנב הציפור', pinyin: 'Lǎn Què Wěi 揽雀尾', minWeek: 2, kneeLoad: 'low-medium', durationSecs: 8,
    front: 'Movement: Grasp the Bird\'s Tail (Lan Que Wei), simplified ward-off and press, performed slowly toward the right. Standing tall, she slides the right foot ONE SMALL STEP forward (about half a foot length), keeping the stance narrow and tall: the front knee bends only slightly and stays above the front foot, the back leg nearly straight with the heel down, hips high. The right forearm rises rounded in front of the chest, palm inward (ward off), the left palm follows behind it; then both hands press gently forward at chest height; then she sits back softly onto the left leg while the hands draw back toward the chest. Finally she slides the right foot back beside the left and lowers the arms. No squat, no wide stance.',
    side: 'Movement: Grasp the Bird\'s Tail (Lan Que Wei), simplified ward-off and press, seen in exact side profile from her right side, moving toward the left edge of the frame. Standing tall, she slides the front foot ONE SMALL STEP forward (about half a foot length) so the stance stays short and tall: the front knee bends only slightly and stays above the front foot, the back leg nearly straight, BOTH HEELS ON THE FLOOR, hips high, spine vertical. The front forearm rises rounded at chest height (ward off), then both palms press gently forward, then she sits back softly onto the rear leg drawing the hands toward the chest, and finally slides the front foot back and lowers the arms. No lunge, no deep stance.',
  },
  weight_shift: {
    nameHe: 'העברת משקל', pinyin: 'Qǐshì 起势 (בסיס)', minWeek: 1, kneeLoad: 'low', durationSecs: 6,
    front: 'Movement: basic Tai Chi weight shifting with the opening posture. BOTH FEET STAY GLUED TO THE FLOOR, parallel, shoulder-width apart, for the entire clip. First both arms float slowly UP IN FRONT OF THE BODY (not to the sides) to shoulder height, palms facing down, wrists relaxed, elbows soft, then sink slowly back down to the hips. Then, standing tall with the knees only softly unlocked, she glides her hips sideways so the weight moves fully onto the right leg, then back through center fully onto the left leg, then back to center. Her head stays at the same height the whole time: the hips move horizontally, the body never sinks or squats.',
    side: 'Movement: basic Tai Chi weight shifting with the opening posture, seen in exact side profile from her right side. BOTH FEET STAY GLUED TO THE FLOOR for the entire clip: no step, no walking. Both arms float slowly up in front of the body to shoulder height, palms down, elbows soft, then sink slowly back to the hips. Then, standing tall, she sways her weight very gently forward toward the toes and back toward the heels, a small comfortable sway, with the spine vertical and the head above the pelvis, knees only softly unlocked.',
  },
};

export function clipPrompt(id, view) {
  const m = MOVEMENTS[id];
  return [COMMON.intro, m[view], COMMON.posture, COMMON.motion, COMMON.loop, COMMON.camera].join(' ');
}

export async function makeClip(id, view, { model = config.video.model_id, suffix = `_v${PROMPT_VERSION}` } = {}) {
  const ref = path.join(ROOT, 'content', 'character', `${view}.png`);
  const frame = imageRef(ref);
  const request = {
    model_id: model, prompt: clipPrompt(id, view), negative_prompt: COMMON.negative,
    duration_secs: MOVEMENTS[id].durationSecs || config.video.duration_secs, aspect_ratio: '16:9', resolution: config.video.resolution,
    generate_audio: false, enhance_prompt: true, // Veo: אי אפשר לכבות (model_error 31.10)
    start_frame: frame, end_frame: frame,
  };
  const r = await generate('video', request, { ext: 'mp4', pollMs: 10000, stage: 3, label: `${id} ${view}` });
  const dest = copyTo(r.file, path.join(OUT, `${id}_${view}${suffix}.mp4`));
  fs.writeFileSync(path.join(OUT, `${id}_${view}${suffix}.prompt.json`), JSON.stringify({ prompt_version: PROMPT_VERSION, ...request, start_frame: `<${ref}>`, end_frame: `<${ref}>`, generation_id: r.id, cache_key: r.key }, null, 2));
  return dest;
}

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  const [id, view = 'front'] = process.argv.slice(2);
  if (!MOVEMENTS[id]) { console.error('תנועות:', Object.keys(MOVEMENTS).join(', ')); process.exit(1); }
  console.log(await makeClip(id, view));
}

// ---- ניסיון 3: וידאו נייטרלי → תמונת-מפתח (4 ש'). באפליקציה מנוגן קדימה ואחורה = 8 ש' בלולאה. ----
export const KEYFRAME_CLIPS = {
  cloud_hands_front:        { movement: 'cloud_hands', view: 'front', text: 'Her weight glides slowly onto the right leg while the right hand floats up to face height, palm toward her face, and the left hand floats down to hip height. The feet never move.' },
  cloud_hands_side:         { movement: 'cloud_hands', view: 'side',  text: 'Her weight glides slowly onto the front-facing leg while one hand floats up to face height, palm toward her face, and the other hand floats down to hip height. The feet never move.' },
  grasp_bird_tail_front:    { movement: 'grasp_bird_tail', view: 'front', text: 'She slides the right foot one small step forward (half a foot length) while the right forearm floats up rounded in front of the chest, palm toward the chest, and the left palm settles just behind the right wrist. The stance stays short and tall, both heels on the floor.' },
  grasp_bird_tail_side:     { movement: 'grasp_bird_tail', view: 'side',  text: 'She slides the front foot one small step forward (half a foot length) while the front forearm floats up rounded at chest height and the other palm settles just behind the front wrist. The stance stays short and tall, both heels on the floor.' },
  weight_shift_front_arms:  { movement: 'weight_shift', view: 'front', text: 'Both arms float slowly straight forward and up to shoulder height, palms down, wrists relaxed, elbows soft. The feet never move, the knees stay softly unlocked, the body does not sink.' },
  weight_shift_side_arms:   { movement: 'weight_shift', view: 'side',  text: 'Both arms float slowly straight forward and up to shoulder height, palms down, wrists relaxed, elbows soft. The feet never move, the knees stay softly unlocked, the body does not sink.' },
  weight_shift_front_right: { movement: 'weight_shift', view: 'front', text: 'Her pelvis glides slowly sideways to her right until the weight is fully on the right leg, the head staying at the same height. The feet never move, the arms stay relaxed at the sides.' },
};

Object.assign(KEYFRAME_CLIPS, KEYFRAME_CLIPS_4A, KEYFRAME_CLIPS_REDO, KEYFRAME_CLIPS_4B, KEYFRAME_CLIPS_TCA);

export function keyframeClipPrompt(k) {
  const c = KEYFRAME_CLIPS[k];
  return [
    'Gentle, slow movement therapy for seniors at home, NOT martial arts. The same woman, same studio, same clothes and lighting.',
    'She moves slowly and smoothly from the pose in the first frame to exactly the pose in the last frame, in one continuous motion, nothing else.',
    c.text, COMMON.posture, COMMON.camera,
  ].join(' ');
}

export async function makeKeyframeClip(k, { model = config.video.model_id } = {}) {
  const c = KEYFRAME_CLIPS[k];
  const start = c.start ? path.join(ROOT, 'outputs', 'stage3', 'keyframes', `${c.start}.png`) : path.join(ROOT, 'content', 'character', `${c.view}.png`);
  const endKey = c.end || k;
  const end = path.join(ROOT, 'outputs', 'stage3', 'keyframes', `${endKey}.png`);
  const request = { model_id: model, prompt: keyframeClipPrompt(k), negative_prompt: COMMON.negative, duration_secs: 4, aspect_ratio: '16:9', resolution: config.video.resolution, generate_audio: false, enhance_prompt: true, start_frame: imageRef(start), end_frame: imageRef(end) };
  const r = await generate('video', request, { ext: 'mp4', pollMs: 10000, stage: 3, label: `kf ${k}` });
  const dest = copyTo(r.file, path.join(OUT, `${k}_kf.mp4`));
  fs.writeFileSync(path.join(OUT, `${k}_kf.prompt.json`), JSON.stringify({ prompt_version: 3, method: 'keyframe', ...request, start_frame: `<${start}>`, end_frame: `<${end}>`, generation_id: r.id, cache_key: r.key }, null, 2));
  return dest;
}
