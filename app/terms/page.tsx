import Link from "next/link"

export const metadata = {
  title: "תנאי שימוש — דירות",
  description: "תנאי השימוש בשירות דירות — ניתוח השקעות פינוי בינוי מבוסס בינה מלאכותית",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <article className="mx-auto max-w-2xl space-y-8 text-foreground">
        <header>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            &larr; חזרה לעמוד הראשי
          </Link>
          <h1 className="mt-4 text-3xl font-bold">תנאי שימוש</h1>
          <p className="mt-2 text-sm text-muted-foreground">עודכן לאחרונה: מרץ 2026</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. תיאור השירות</h2>
          <p className="leading-7">
            דירות הוא כלי ניתוח מבוסס בינה מלאכותית (AI) לחקר השקעות פינוי בינוי בישראל. השירות משתמש בנתונים ממאגרי מידע ממשלתיים (data.gov.il), רשות התכנון (XPLAN), ונתוני שוק נדל&quot;ן כדי לספק ניתוחים אוטומטיים, דירוגים ומחקר.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. הגבלות השירות — בינה מלאכותית</h2>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <p className="font-medium">חשוב לקרוא בעיון:</p>
            <ul className="list-disc space-y-2 ps-5 leading-7">
              <li>
                <strong>תוצרי ה-AI עלולים להיות לא מדויקים, חלקיים, או להכיל שגיאות.</strong> בשל האופי ההסתברותי של בינה מלאכותית, הניתוחים עשויים שלא לשקף את המציאות בשטח.
              </li>
              <li>
                <strong>השירות אינו מהווה תחליף לייעוץ מקצועי.</strong> הניתוחים אינם מחליפים שמאי מקרקעין, עורכי דין, יועצי השקעות, רואי חשבון או כל בעל מקצוע מורשה אחר.
              </li>
              <li>
                <strong>הניתוח אינו שומת מקרקעין.</strong> מערכת הדירוג והניתוחים אינם מהווים שומה מוסמכת על פי חוק.
              </li>
              <li>
                <strong>אין המלצה לקנות או למכור.</strong> המידע מוצג למטרות מידע בלבד. דירות אינה ממליצה, תומכת או מייעצת לגבי עסקאות ספציפיות.
              </li>
              <li>
                <strong>על המשתמש לאמת את המידע באופן עצמאי.</strong> יש לבצע הצלבה עם מקורות רשמיים ולהתייעץ עם אנשי מקצוע לפני כל החלטה.
              </li>
              <li>
                <strong>תחזיות עתידיות עשויות שלא להתממש.</strong> הערכות לגבי לוחות זמנים, מגמות מחירים והתחדשות עירונית מבוססות על נתונים זמינים בלבד.
              </li>
              <li>
                <strong>המידע עשוי להיות לא עדכני.</strong> מאגרי הנתונים הממשלתיים מסונכרנים מעת לעת ועשויים שלא לשקף שינויים אחרונים.
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. אחריות המשתמש</h2>
          <ul className="list-disc space-y-1 ps-5 leading-7">
            <li>המשתמש נושא באחריות הבלעדית להחלטות המתקבלות על בסיס השירות</li>
            <li>השימוש בשירות מותר למשתמשים מגיל 18 ומעלה</li>
            <li>אין להשתמש בשירות למטרות בלתי חוקיות</li>
            <li>אין לשתף פרטי גישה לחשבון עם אחרים</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. קניין רוחני</h2>
          <p className="leading-7">
            תוכן השירות, העיצוב ומתודולוגיית הניתוח שייכים לדירות. המשתמש שומר על הבעלות על הקלט שלו (שאלות, הערות שנשמרו). המשתמש מעניק לדירות רישיון לעבד את הקלט לצורך מתן השירות ושיפור איכותו (באופן אנונימי).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. הגבלת אחריות</h2>
          <p className="leading-7">
            השירות מסופק <strong>&quot;כמות שהוא&quot; (AS IS)</strong> ללא כל אחריות מפורשת או משתמעת. דירות אינה אחראית לנזקים ישירים או עקיפים הנובעים מהסתמכות על הניתוחים. אחריות דירות מוגבלת, בכל מקרה, לסכום ששולם עבור השירות ב-12 החודשים שקדמו לאירוע.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. סיום חשבון</h2>
          <p className="leading-7">
            דירות רשאית להשעות או לסגור חשבונות בגין הפרת תנאי השימוש. המשתמש רשאי לבקש מחיקת חשבון ונתונים. עם מחיקת חשבון, הנתונים האישיים יימחקו. נתונים אנונימיים ומצטברים עשויים להישמר.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. שינויים בתנאים</h2>
          <p className="leading-7">
            דירות רשאית לעדכן תנאים אלו מעת לעת. הודעה על שינויים מהותיים תישלח באימייל או תוצג בשירות. המשך השימוש לאחר ההודעה מהווה הסכמה לתנאים המעודכנים.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. דין חל וסמכות שיפוט</h2>
          <p className="leading-7">
            על תנאים אלו חל הדין הישראלי. סמכות השיפוט הבלעדית נתונה לבתי המשפט בתל אביב-יפו. הנוסח בעברית הוא הנוסח המחייב.
          </p>
        </section>

        <footer className="border-t border-border pt-6 text-sm text-muted-foreground">
          <p>
            לשאלות בנוגע לתנאי השימוש, ניתן לפנות אלינו בכתובת:{" "}
            <a href="mailto:support@matama.co.il" className="text-primary hover:underline">
              support@matama.co.il
            </a>
          </p>
          <p className="mt-2">
            <Link href="/privacy" className="text-primary hover:underline">מדיניות פרטיות</Link>
          </p>
        </footer>
      </article>
    </div>
  )
}
