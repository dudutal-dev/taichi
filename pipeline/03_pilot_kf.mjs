// ניסיון 3 — כל קליפי תמונות-המפתח במקביל.
import { makeKeyframeClip, KEYFRAME_CLIPS } from './02_clips.mjs';
import { KEYFRAME_CLIPS_4A, KEYFRAME_CLIPS_REDO } from './clips_4a.mjs';
const arg = process.argv.slice(2);
const keys = arg[0] === '4a' ? [...Object.keys(KEYFRAME_CLIPS_4A), ...Object.keys(KEYFRAME_CLIPS_REDO)] : arg.length ? arg : Object.keys(KEYFRAME_CLIPS);
for (let i = 0; i < keys.length; i += 8) {
  const batch = keys.slice(i, i + 8);
  const res = await Promise.allSettled(batch.map(k => makeKeyframeClip(k)));
  res.forEach((r, j) => console.log(`${batch[j]}: ${r.status === 'fulfilled' ? r.value : 'FAILED ' + r.reason.message}`));
}
