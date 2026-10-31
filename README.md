# טאי צ'י 150

אפליקציית תרגול טאי צ'י אישית בעברית לבן 50+ שמתרגל לבד בבית.
יעד: 150 דקות בשבוע, 5 מפגשים, 12 שבועות. בלי שרת, בלי חשבון, בלי טלמטריה.

מסמך ההנחיה המלא: "טאי צ'י 150 — מסמך הנחיה לקלוד קוד" (31.10.2026).

## מבנה

```
app/        האפליקציה (PWA: Vite + React + TypeScript, Dexie)
pipeline/   צנרת ייצור תוכן דרך ElevenLabs — רצה פעם אחת, לא בזמן ריצה
content/    התוצרים: וידאו, אודיו, תסריטים, manifest.json
reference/  סרטוני/תמונות ייחוס לבקרת איכות (לא נכנסים ל-build)
outputs/    עותקי ביניים לדודו, לפי שלב
```

## הכרעות (31.10.2026)

- מיקום: שולחן העבודה, `taichi150`.
- מפתח ElevenLabs: המפתח הקיים. עובד ל-TTS, STT, Image ו-Video. חסרות לו
  הרשאות קריאה (`voices_read`, `models_read`, `user_read`) ולכן קולות ומודלים
  נבחרים לפי מזהים ידועים, ואי אפשר לקרוא יתרת קרדיטים דרך ה-API.
- אחסון וידאו: בתוך האפליקציה עצמה (אותו מקור, `content/video/`), לא בשירות חיצוני.
  הווידאו לא נכנס ל-git. אופן הפריסה של קבצי הווידאו נקבע בשלב 8.
- קול: נשי. נבחר קול מעוצב (Voice Design, תיאור b: מדריכת מדיטציה אימהית בת 45), נשמר לחשבון בשם "TaiChi150 — קריינית".
- דמות: מועמדת 2 (בת 40, חולצה קרם, מכנס פחם), `content/character/front.png` + `side.png`.

## שלבים ומצב

| שלב | תוצר | מצב |
| --- | --- | --- |
| 0 | ריפו, מבנה, `.env.example`, קריאת תיעוד, בדיקת TTS | הושלם 31.10 |
| 1 | `pipeline/01_character` — דמות מדגימה (חזית+צד) | הושלם 31.10: מועמדת 2 |
| 2 | `pipeline/04_narration` — דוגמאות קול | הושלם 31.10: קול מעוצב b-3 (voice_id ב-config) |
| 3 | פיילוט 3 תנועות + QA + אומדן עלות | הושלם 31.10: שיטת תמונות-מפתח (6/7) |
| 4א | תוכן שבועות 1–4: 28 סטילס, 26 לולאות, 64 קריינות, סאונד | הושלם 31.10 (2 קליפים נדחו, יש חלופות) |
| 5 | אפליקציה — שלד: ניווט, מסך היום, נגן, Dexie | הושלם 31.10: מפגש שבוע 1 רץ מקצה לקצה בדפדפן |
| 6 | פתיחה מודרכת + סינון, מדידות 0/6/12/24, התוכנית, ההתקדמות, הספרייה, הגדרות, תזכורות, ייצוא | הושלם 31.10; 15 בדיקות יחידה |
| 7 | מוטיבציה + בטיחות: טבעת, שבועות ירוקים, הודעות מורה, ניטור כאב, התאמות | הושלם 31.10 (adapt.ts, Finish, Today; הודעות מורה במפגש הראשון של כל שבוע) |
| 8 | PWA + הורדת תוכן לאופליין + 9:16 + Cast + GitHub Actions→Pages | באוויר 31.10: https://dudutal-dev.github.io/taichi/ — ממתין לבדיקה בטלפון |
| 4ב | שאר התוכן: שבועות 5–12 + Baduanjin בישיבה (TCA ממתין לאישור הרשימה) | חלקי 31.10: 26/49 קליפים נוצרו (23 אושרו), ואז נגמרה המכסה. `outputs/stage4/QA_4b.md` |
| 9 | בדיקות קבלה + תיקונים | בתהליך: `outputs/stage9/ACCEPTANCE.md` |

## הרצה

```
cd app && npm install && npm run dev     # האפליקציה על http://localhost:5173 (התוכן מוגש מ-content/)
cd app && npm test                       # בדיקות יחידה: טבעת 150, שבועות ירוקים
```

צנרת:

```
cp .env.example .env        # ולמלא ELEVENLABS_API_KEY
node pipeline/00_check.mjs  # בדיקת מפתח + TTS עברי עם תמלול חזרה
```

התוצרים של כל שלב נשמרים ב-`outputs/stage<N>/`.
מפרט ה-API המאומת: `pipeline/DOCS.md`.

## כללים קבועים

- האפליקציה לעולם לא קוראת ל-ElevenLabs. המפתח חי רק ב-`.env` של הצנרת.
- האפליקציה טוענת רק פריטים `approved` מהמניפסט.
- אין ייצור תוכן מלא לפני אישור הפיילוט.
- כל קריאה לצנרת: retry, cache לפי hash של הפרומפט, רישום עלות ב-`pipeline/costs.json`.

## פריסה (שלב 8)

- `.github/workflows/pages.yml`: בכל push ל-main — בדיקות, build עם `VITE_BASE=/<שם הריפו>/`, בדיקה שאין מפתח API ב-dist, פריסה ל-GitHub Pages.
  בהגדרות הריפו: Settings → Pages → Source = **GitHub Actions**.
- הלולאות המאושרות (`content/video`, 16:9 + 9:16) נכנסות לריפו ול-dist (הכרעת דודו: וידאו בתוך האפליקציה). כרגע ~105MB.
  כשהתוכן יגדל מעבר ל-~500MB — לעבור ל-GitHub Releases/R2 עם `VITE_CONTENT_BASE`.
- אופליין: ה-service worker מטמין את המעטפת; מסך "תוכן ללא רשת" (`#/download`) מוריד את כל הווידאו והקריינות ל-Cache API.
- 9:16: `pipeline/portrait.sh` יוצר חיתוך מרכזי לכל לולאה; הנגן בוחר לפי כיוון המסך.
- התקנה בטלפון: לפתוח את כתובת ה-Pages בדפדפן → "הוסף למסך הבית".

```
git remote -v   # origin = https://github.com/dudutal-dev/taichi.git
git push        # כל push ל-main פורס מחדש
```

## איך מוסיפים תנועה

1. **סטיל של שיא התנועה**: מוסיפים רשומה ל-`pipeline/keyframes_4b.mjs` (id, `ref` חזית/צד או תמונת-מפתח קיימת כבסיס, פרומפט, `extraRefs` אם צריך "לשנות רק X"), ומריצים `node pipeline/02a_keyframes.mjs <id>`. הסטיל נשמר ב-`outputs/stage3/keyframes/<id>.png`. דודו מאשר.
2. **קליף**: מוסיפים רשומה ל-`pipeline/clips_4b.mjs` (movement, view, פרומפט תנועה, `start` אם לא מתחילים מנייטרלי), ומריצים `node pipeline/03_pilot_kf.mjs <id>` (קליף Veo 4 ש' = 4,848 קרדיטים). QA: `bash pipeline/qa_kf.sh <id>` → גיליון פריימים + SSIM.
3. **הכרעה**: רשומה ב-`pipeline/qa_status.json` (`approved`/`rejected` + הערה). רק approved נכנס לאפליקציה.
4. **לולאה**: `bash pipeline/pingpong.sh outputs/stage3/<id>_kf.mp4 outputs/stage3/loops/<id>_loop.mp4`.
5. **הרכבה**: `node pipeline/06_assemble.mjs` (מעתיק לולאות ל-`content/video`, סטילים ל-`content/stills`, כותב `content/manifest.json`), ואז `bash pipeline/portrait.sh` לגרסאות 9:16. תנועה חדשה צריכה גם שורה ב-`MOVEMENTS` שבאותו קובץ (שם, פין-יין, מסלול, שבוע, עומס ברך, 3 נקודות).
6. **באפליקציה**: `MovementDef` ב-`app/src/content/plan.ts` (יחידות: front/side/cues/sideCue/label/balance) והוספה ל-`WEEKS`. אם אין קליף חזיתי מאושר, הצד הופך לזווית הראשית; אם אין שום קליף, מוצג סטיל + קריינות.

## איך עורכים קריינות ומייצרים מחדש

התסריטים ב-`content/scripts/he/*.md`, שורה לכל קובץ: `id: <id> | <טקסט>`. ניקוד נקודתי פותר הגייה (`הוֹצֵא`, `הֲדִיפַת`).
`node pipeline/04_narration.mjs content/scripts/he/<file>.md` מפיק רק מה שהשתנה (cache לפי hash של הטקסט), מתמלל חזרה (scribe) ומסמן אי-התאמות ב-`qa`. אחר כך `node pipeline/06_assemble.mjs`.
מחיר: 1 קרדיט לתו. הקול: `voice_id` ב-`pipeline/config.json`, מודל `eleven_v4`.

## מוזיקה ואווירה

`node pipeline/05_music.mjs previews` הפיק 3 תצוגות של 60 ש' (`outputs/stage4/audio/music_{a,b,c}_preview60s.mp3`); תצוגה א' משמשת בינתיים בנגן. אחרי בחירה: `node pipeline/05_music.mjs full <a|b|c>` → רצועה של 10 דק' (כ-9,000 קרדיטים).
