// התוכנית: 12 שבועות כמסלול אנכי. השבוע הנוכחי מודגש; לכל שבוע: שלב, תנועות חדשות, "מה הניסויים ראו". שערי מדידה מסומנים.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProfile, todayISO } from '../db';
import { weekNumber } from '../lib/week';
import { WEEKS } from '../content/plan';

const LATER = [
  { week: 5, stage: 'רצף', newMovements: ['פיצול רעמת הסוס הפראי', 'הדיפת הקוף'], evidence: 'שבוע 5: רצף מלא 0→9. תנועות עם עומס ברך נכנסות, בעמידה גבוהה בלבד.', gate: null, min: 25 },
  { week: 6, stage: 'רצף', newMovements: [], evidence: 'שבוע 6: כאן הניסויים ראו שינוי ראשון בשיווי המשקל ובכוח הרגליים.', gate: 'מדידה חוזרת', min: 25 },
  { week: 7, stage: 'עומק', newMovements: ['בעיטת עקב (ליד כיסא)'], evidence: 'שבועות 7–9: סיבובי גו, דגש על נשימה. הרצף פעמיים.', gate: null, min: 30 },
  { week: 8, stage: 'עומק', newMovements: [], evidence: 'שבוע 8: שינה ומצב רוח מתחילים להשתנות (8–12).', gate: null, min: 30 },
  { week: 9, stage: 'עומק', newMovements: [], evidence: 'שבוע 9: צורת 8 שלמה, חלקה.', gate: null, min: 30 },
  { week: 10, stage: 'צורת 24', newMovements: ['העגור הלבן', 'נגינה בפיפה', 'שוט יחיד'], evidence: 'שבועות 10–12: תנועות חדשות מצורת 24.', gate: null, min: 30 },
  { week: 11, stage: 'צורת 24', newMovements: ['טפיחה גבוהה על הסוס', 'מחט בקרקעית הים', 'מניפה דרך הגב'], evidence: '', gate: null, min: 30 },
  { week: 12, stage: 'צורת 24', newMovements: ['העלמה אורגת', 'סגירה לכאורה'], evidence: 'שבוע 12: לחץ דם, אם נמדד, מתחיל לזוז. סיום התוכנית.', gate: 'מדידה', min: 30 },
];

export default function Plan() {
  const [current, setCurrent] = useState(1);
  useEffect(() => { getProfile().then(p => p && setCurrent(weekNumber(p.startDate, todayISO()))); }, []);
  const rows = [
    { week: 0, stage: 'שבוע 0', newMovements: [], evidence: 'סינון בריאותי ומדידת בסיס.', gate: 'מדידת בסיס', min: 5 },
    ...WEEKS.map(w => ({ week: w.week, stage: w.stage, newMovements: w.newMovements, evidence: w.evidence, gate: null as string | null, min: w.plannedMin })),
    ...LATER,
  ];
  return (
    <section className="flex flex-col gap-4 pt-2">
      <h1 className="text-3xl font-extrabold">התוכנית</h1>
      <p className="text-[var(--fg-soft)]">12 שבועות, 5 מפגשים בשבוע. אחר כך תחזוקה עם ערבוב מסלולים. ההגנה מפני נפילות דועכת כשמפסיקים.</p>
      <ol className="relative border-s-4 border-[var(--line)] ms-3 flex flex-col gap-3">
        {rows.map(r => {
          const now = r.week === current;
          return (
            <li key={r.week} className={`ms-5 card p-4 ${now ? 'border-[var(--color-bamboo)] border-2' : ''}`}>
              <span className={`absolute -start-[14px] mt-1 w-6 h-6 rounded-full border-4 ${now ? 'bg-[var(--color-bamboo)] border-[var(--color-bamboo)]' : 'bg-[var(--bg)] border-[var(--line)]'}`} aria-hidden />
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-xl font-extrabold">{r.week === 0 ? 'שבוע 0' : `שבוע ${r.week}`} · {r.stage}</h2>
                <span className="text-[var(--fg-soft)]">{r.min} דק'</span>
              </div>
              {r.newMovements.length > 0 && <p className="mt-1">חדש: {r.newMovements.join(', ')}</p>}
              {r.evidence && <p className="text-[var(--fg-soft)] mt-1">{r.evidence}</p>}
              {r.gate && <p className="mt-2 inline-block chip !min-h-9 !px-3 text-sm">{r.gate}{(r.week === 6 || r.week === 12) && current >= r.week ? <Link to={`/measure/${r.week}`} className="ms-2 underline">למדוד עכשיו</Link> : null}</p>}
              {now && <p className="mt-2 font-extrabold text-[var(--color-bamboo)]">אתה כאן</p>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
