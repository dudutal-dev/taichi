// שלב 3 — הפיילוט: כל הקליפים שחסרים לשלוש התנועות, במקביל.
import { makeClip } from './02_clips.mjs';
const JOBS = [['cloud_hands', 'side'], ['grasp_bird_tail', 'front'], ['grasp_bird_tail', 'side'], ['weight_shift', 'front'], ['weight_shift', 'side']];
const res = await Promise.allSettled(JOBS.map(([id, v]) => makeClip(id, v)));
res.forEach((r, i) => console.log(`${JOBS[i].join(' ')}: ${r.status === 'fulfilled' ? r.value : 'FAILED ' + r.reason.message}`));
