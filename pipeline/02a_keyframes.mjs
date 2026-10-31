// ניסיון 3 — תמונות-מפתח (שיא התנועה) מאותה דמות, לאישור דודו לפני וידאו.
// הרצה: node pipeline/02a_keyframes.mjs            → כל תמונות-המפתח של הפיילוט
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, config, generate, imageRef, copyTo } from './lib.mjs';
import { KEYFRAMES_4A } from './keyframes_4a.mjs';
import { KEYFRAMES_4B } from './keyframes_4b.mjs';

const OUT = path.join(ROOT, 'outputs', 'stage3', 'keyframes'); fs.mkdirSync(OUT, { recursive: true });

const SAME = 'Photorealistic full-body photograph of the exact same woman as in the reference image: same face, same hair, same cream long-sleeve top, same charcoal trousers, same shoes, same plain studio, same lighting, same camera position and framing (whole body from head to feet with margin).';
const TALL = 'She stands TALL: hips high, knees only softly unlocked (a slight bend of a few degrees, never a squat, never a lunge), each knee above its own foot, both heels on the floor, spine vertical, shoulders relaxed, chin level, calm gentle face.';
const END = 'A single frozen pose, no motion blur. No text, no logos, no props, no other people.';

export const KEYFRAMES = {
  cloud_hands_front: { ref: 'front', pose: 'Pose: the peak of Cloud Hands (Yun Shou), stationary version, seen from the front. Feet parallel, shoulder-width apart, both flat on the floor. Her weight is fully on the right leg, the waist turned slightly to the right. The right hand floats at face height in front of her, palm facing her face, elbow soft. The left hand floats at hip height in front of the lower belly, palm facing her body.' },
  cloud_hands_side: { ref: 'side', pose: 'Pose: the peak of Cloud Hands (Yun Shou), stationary version, seen in exact side profile from her right side (she faces the left edge of the frame). Feet parallel, both flat on the floor. One hand floats at face height in front of her, palm toward her face, elbow soft and close to the ribs; the other hand floats at hip height in front of the lower belly. Her spine is vertical, the head directly above the pelvis.' },
  grasp_bird_tail_front: { ref: 'front', pose: 'Pose: ward-off (Peng), the first part of Grasp the Bird\'s Tail, seen from the front. The right foot is ONE SMALL STEP forward, about half a foot length, so the stance is short and narrow; the front (right) knee is only slightly bent and directly above the right foot; the back (left) leg nearly straight with the heel flat on the floor; hips high. The right forearm is rounded horizontally in front of the chest, palm facing her chest, as if holding a large ball; the left palm is just behind the right wrist, facing it.' },
  grasp_bird_tail_side: { ref: 'side', pose: 'Pose: ward-off (Peng), the first part of Grasp the Bird\'s Tail, seen in exact side profile from her right side, facing the left edge of the frame. The front foot is ONE SMALL STEP forward, about half a foot length, so the stance is short; the front knee is only slightly bent and directly above the front foot; the back leg nearly straight with BOTH HEELS FLAT on the floor; hips high, spine vertical. The front forearm is rounded horizontally at chest height, palm toward her chest; the other palm is just behind the front wrist.' },
  weight_shift_front_arms: { ref: 'front', pose: 'Pose: the opening of Tai Chi, seen from the front. Feet parallel, shoulder-width apart, both flat on the floor, weight even. Both arms float straight forward in front of the body at shoulder height, parallel to the floor and to each other, shoulder-width apart, palms facing down, wrists relaxed and fingers soft, elbows slightly bent.' },
  weight_shift_side_arms: { ref: 'side', pose: 'Pose: the opening of Tai Chi, seen in exact side profile from her right side, facing the left edge of the frame. Feet parallel, both flat on the floor. Both arms float straight forward at shoulder height, parallel to the floor, palms facing down, wrists relaxed, elbows slightly bent; the arms overlap in profile. Spine vertical, head above the pelvis.' },
  weight_shift_front_right: { ref: 'front', pose: 'Pose: basic weight shift, seen from the front. THE FEET DO NOT MOVE: both feet stay exactly where they are in the reference image, parallel, shoulder-width apart, both flat on the floor, same stance width as the reference. Only the pelvis has glided clearly sideways to her right, so the hips are visibly over the right foot and the weight is fully on the right leg; the left leg is light, the left foot still flat on the floor. The torso stays upright and centered over the right leg, the arms hang relaxed at the sides. The head is at the same height as in neutral standing: the hips moved horizontally, the body did not sink.' },
};

Object.assign(KEYFRAMES, KEYFRAMES_4A, KEYFRAMES_4B);

export function keyframePrompt(k) { return [SAME, KEYFRAMES[k].pose, TALL, END].join(' '); }

export async function makeKeyframe(k) {
  const refName = KEYFRAMES[k].ref;
  const ref = (refName === "front" || refName === "side") ? path.join(ROOT, "content", "character", `${refName}.png`) : path.join(OUT, `${refName}.png`); // בסיס: הדמות, או תמונת-מפתח קיימת
  const extra = (KEYFRAMES[k].extraRefs || []).map(f => imageRef(path.join(ROOT, 'outputs', 'stage3', 'keyframes', f)));
  const request = { model_id: config.image.model_id, prompt: keyframePrompt(k), aspect_ratio: '16:9', resolution: config.image.resolution, images: [imageRef(ref), ...extra] };
  const r = await generate('image', request, { ext: 'png', pollMs: 3000, stage: 3, label: `keyframe ${k}` });
  return copyTo(r.file, path.join(OUT, `${k}.png`));
}

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  const arg = process.argv.slice(2);
  const keys = arg[0] === '4a' ? Object.keys(KEYFRAMES_4A) : arg[0] === '4b' ? Object.keys(KEYFRAMES_4B).filter(k => !['neutral_chair_side', 'seated_front', 'seated_side'].includes(k)) : arg.length ? arg : Object.keys(KEYFRAMES);
  for (let i = 0; i < keys.length; i += 7) {
    const batch = keys.slice(i, i + 7);
    const res = await Promise.allSettled(batch.map(makeKeyframe));
    res.forEach((r, j) => console.log(`${batch[j]}: ${r.status === 'fulfilled' ? 'ok' : 'FAILED ' + r.reason.message}`));
  }
  fs.writeFileSync(path.join(OUT, 'prompts.json'), JSON.stringify(Object.fromEntries(keys.map(k => [k, keyframePrompt(k)])), null, 2));
}
