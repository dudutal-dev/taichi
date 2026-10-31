# QA שלב 4ב — 31.10.2026

הייצור נעצר באמצע: המכסה של ElevenLabs נגמרה (הודעת ה-API: quota 603,757 קרדיטים, נשארו 3,112, קליף דורש 4,848). 26 מתוך 49 קליפים הושלמו, 23 לא נוצרו.

## מה נבדק
לכל קליף: גיליון 6 פריימים (`outputs/stage3/<id>_kf_sheet.png`), SSIM פריים ראשון מול תמונת הבסיס ופריים אחרון מול תמונת-המפתח (כולם 0.88–0.93, `outputs/stage4b_qa_kf.txt`). הצפייה המלאה בתנועה היא של דודו.

## הכרעות (23 אושרו, 3 נדחו)

| קליף | הכרעה | הערה |
|---|---|---|
| golden_rooster_left_front | **נדחה** | כף רגל על הירך (תנוחת "עץ") באמצע, יד מעל הראש. באפליקציה: מבט הצד הוא הראשי |
| golden_rooster_right_front | **נדחה** | אותה בעיה. באפליקציה: סטיל של תמונת-המפתח + קריינות |
| golden_rooster_side | אושר | יד על הכיסא כל הזמן, הברך עולה קדימה בסיום |
| wild_horse ×4 | אושר | ימין-חזית: היד עולה גבוה באמצע |
| repulse_monkey ×4 | אושר | בחזית הסיום הוא דחיפה בשתי כפות (גרסה פשוטה) |
| heel_kick_right_front | **נדחה** | אין יד על הכיסא, ידיים פרושות, רגל הצידה. באפליקציה: מבט הצד הוא הראשי לרגל ימין |
| heel_kick_left_front | אושר | יד על הכיסא, רגל נמוכה |
| heel_kick_side | אושר | עקב מוביל, נמוך, יד על הכיסא |
| single_whip ×2 | אושר | |
| white_crane ×2 | אושר | חזית: מעבר דמוי הצדעה באמצע |
| play_pipa ×2 | אושר | חזית: מעבר ביניים מוזר, סיום נכון |
| high_pat_horse ×2 | אושר | |
| strike_ears ×2 | אושר | חזית נראית כמו "הצגת שרירים" |
| needle_sea_bottom_side | אושר | כיפוף מתון, גב ארוך |
| shuttle_left_front | אושר | |

## מה חסר (23 קליפים, לא נוצרו)
shuttle_right_front, shuttle_side, needle_sea_bottom_front, fan_through_back_front, fan_through_back_side, parry_front, punch_front, punch_side, apparent_close_front, apparent_close_side, bdj_heaven_front, bdj_heaven_side, bdj_bow_left_front, bdj_bow_right_front, bdj_separate_left_front, bdj_separate_right_front, bdj_lookback_left_front, bdj_lookback_right_front, bdj_sway_left_front, bdj_sway_right_front, bdj_feet_side, bdj_fists_left_front, bdj_fists_right_front.

ועוד 3 לייצור מחדש (הנדחים למעלה). סה"כ 26 קליפים × 4,848 = 126,048 קרדיטים כשיש מכסה.

## איך האפליקציה מתמודדת בינתיים
`buildSession` ב-`app/src/content/plan.ts`: יחידה בלי קליף חזיתי מאושר משתמשת בקליף הצד כזווית ראשית; יחידה בלי שום קליף מציגה סטיל של תמונת-המפתח עם הקריינות. כך שבועות 4–12 ומסלול הישיבה רצים מקצה לקצה גם עכשיו (מסלול הישיבה: כולו סטילים + קריינות עד שייווצרו הקליפים).
