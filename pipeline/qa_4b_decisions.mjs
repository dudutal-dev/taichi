// החלטות QA לשלב 4ב (31.10, אחרי בדיקת גיליונות הפריימים של 26 הקליפים שהושלמו לפני שנגמרה המכסה).
// מריצים פעם אחת: node pipeline/qa_4b_decisions.mjs → מעדכן pipeline/qa_status.json (לא דורס רשומות קיימות).
import fs from 'node:fs';
const file = new URL('./qa_status.json', import.meta.url);
const qa = JSON.parse(fs.readFileSync(file, 'utf8'));
const D = {
  // תרנגול הזהב
  golden_rooster_left_front:  ['rejected', 'באמצע הקליף כף הרגל נשענת על הירך (תנוחת "עץ") והיד עולה מעל הראש — לא טאי צ\'י ומסוכן לשיווי משקל. הסיום נכון. חלופה באפליקציה: מבט הצד הוא הזווית הראשית; לייצר מחדש כשיש קרדיטים'],
  golden_rooster_right_front: ['rejected', 'כמו שמאל: כף רגל על הירך באמצע. באפליקציה: סטיל של תמונת-המפתח (נכונה: יד על הכיסא, ברך נמוכה) + קריינות'],
  golden_rooster_side:        ['approved', 'הרגל עוברת רגע אחורה לפני שהברך עולה קדימה; הסיום נכון, יד על הכיסא כל הזמן'],
  // רעמת הסוס
  wild_horse_left_front:  ['approved', ''],
  wild_horse_left_side:   ['approved', 'היד השנייה על המותן במקום יורדת ליד הירך'],
  wild_horse_right_front: ['approved', 'היד עולה גבוה מגובה הכתף באמצע; בסיום בגובה הפנים'],
  wild_horse_right_side:  ['approved', ''],
  // הדיפת הקוף
  repulse_monkey_left_front:  ['approved', 'בסיום שתי הכפות קדימה (במקום אחת דוחפת ואחת ליד הירך) — דחיפה כפולה, מקובל לגרסה פשוטה'],
  repulse_monkey_left_side:   ['approved', 'צעד אחורה + דחיפה, נכון'],
  repulse_monkey_right_front: ['approved', 'כמו שמאל: שתי כפות קדימה'],
  repulse_monkey_right_side:  ['approved', ''],
  // בעיטת עקב
  heel_kick_right_front: ['rejected', 'הידיים פרושות לצדדים ואין יד על הכיסא — סותר את הקריינות ("יד על הכיסא") ומסוכן. הרגל יוצאת הצידה ולא קדימה. באפליקציה: מבט הצד הוא הזווית הראשית לרגל ימין'],
  heel_kick_left_front:  ['approved', 'יד על הכיסא, הרגל עולה נמוך הצידה (לא בדיוק קדימה) — מקובל'],
  heel_kick_side:        ['approved', 'הרגל עוברת רגע אחורה (צעד) לפני הבעיטה קדימה; הסיום נכון: עקב מוביל, נמוך, יד על הכיסא'],
  // צורת 24
  single_whip_front:     ['approved', 'כף דוחפת + וו מאחור, עמידה רחבה אך גבוהה'],
  single_whip_side:      ['approved', ''],
  white_crane_front:     ['approved', 'באמצע היד מגיעה למצח כמו הצדעה; הסיום נכון (יד מעל הראש כף החוצה, השנייה למטה, בהונות קדמיות)'],
  white_crane_side:      ['approved', ''],
  play_pipa_front:       ['approved', 'מעבר ביניים מוזר (יד לסנטר); הסיום נכון'],
  play_pipa_side:        ['approved', 'עקב קדמי על הרצפה, שתי הידיים קדימה — נכון'],
  high_pat_horse_front:  ['approved', 'היד עולה גבוה באמצע; סיום: כף בגובה הפנים, השנייה כף למעלה'],
  high_pat_horse_side:   ['approved', ''],
  strike_ears_front:     ['approved', 'הסיום נראה כמו "הצגת שרירים" (אגרופים ליד הרקות, מרפקים החוצה) — קרוב לתנועה המקורית'],
  strike_ears_side:      ['approved', ''],
  needle_sea_bottom_side: ['approved', 'כיפוף מתון מהירכיים, הגב ארוך, ברכיים מעט כפופות — מתאים ל-50+'],
  shuttle_left_front:    ['approved', 'יד מעל המצח כף החוצה, השנייה דוחפת — נכון'],
};
let added = 0;
for (const [id, [status, note]] of Object.entries(D)) {
  if (qa[id]) continue;
  qa[id] = { qa: status, note, attempt: 1 };
  added++;
}
fs.writeFileSync(file, JSON.stringify(qa, null, 2) + '\n');
console.log(`נוספו ${added} רשומות; סה"כ ${Object.keys(qa).filter(k => !k.startsWith('_')).length}`);
