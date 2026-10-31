// ניסיון 3 — כל קליפי תמונות-המפתח במקביל.
import { makeKeyframeClip, KEYFRAME_CLIPS } from './02_clips.mjs';
const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(KEYFRAME_CLIPS);
const res = await Promise.allSettled(keys.map(k => makeKeyframeClip(k)));
res.forEach((r, i) => console.log(`${keys[i]}: ${r.status === 'fulfilled' ? r.value : 'FAILED ' + r.reason.message}`));
