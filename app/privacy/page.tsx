import Link from "next/link"

export const metadata = {
  title: "מדיניות פרטיות — דירות",
  description: "מדיניות הפרטיות של דירות — איזה מידע אנחנו אוספים ואיך אנחנו משתמשים בו",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <article className="mx-auto max-w-2xl space-y-8 text-foreground">
        <header>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            &larr; חזרה לעמוד הראשי
          </Link>
          <h1 className="mt-4 text-3xl font-bold">מדיניות פרטיות</h1>
          <p className="mt-2 text-sm text-muted-foreground">עודכן לאחרונה: מרץ 2026</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. מי אנחנו</h2>
          <p className="leading-7">
            דירות היא פלטפורמת ניתוח השקעות פינוי בינוי מבוססת בינה מלאכותית. מדיניות זו מסבירה אילו נתונים אנו אוספים, כיצד אנו משתמשים בהם ומה הזכויות שלך.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. מידע שאנו אוספים</h2>

          <h3 className="font-medium mt-4">מידע שאתה מספק ישירות</h3>
          <ul className="list-disc space-y-1 ps-5 leading-7">
            <li><strong>פרטי חשבון:</strong> שם, כתובת אימייל, סיסמה (מוצפנת) — בעת הרשמה והתחברות</li>
            <li><strong>גישה מוקדמת:</strong> שם ואימייל — בעת הרשמה לרשימת המתנה</li>
            <li><strong>שיחות צ&apos;אט:</strong> ההודעות שאתה שולח לסוכן ה-AI — לצורך ניתוח והצגת תוצאות</li>
            <li><strong>נכסים שמורים:</strong> כתובות, הערות וניתוחים שבחרת לשמור</li>
          </ul>

          <h3 className="font-medium mt-4">מידע שנאסף אוטומטית</h3>
          <ul className="list-disc space-y-1 ps-5 leading-7">
            <li><strong>כתובת IP:</strong> לצורך הגבלת קצב שימוש ואבטחה</li>
            <li><strong>מידע על המכשיר:</strong> סוג דפדפן ומערכת הפעלה (בנתוני session)</li>
            <li><strong>אירועי שימוש:</strong> פעולות באתר כמו התחברות, שליחת הודעות ושמירת נכסים — באמצעות PostHog (מאוחסן באירופה)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. כיצד אנו משתמשים במידע</h2>
          <ul className="list-disc space-y-1 ps-5 leading-7">
            <li><strong>מתן השירות:</strong> עיבוד השאלות שלך, יצירת ניתוחים, שמירת היסטוריית שיחות</li>
            <li><strong>שיפור איכות:</strong> סקירה אנונימית של שיחות (ללא פרטים מזהים) לצורך שיפור דיוק ה-AI</li>
            <li><strong>אבטחה:</strong> הגבלת קצב שימוש, מניעת שימוש לרעה</li>
            <li><strong>אנליטיקה:</strong> הבנת דפוסי שימוש לצורך שיפור המוצר</li>
            <li><strong>תקשורת:</strong> עדכוני שירות והודעות על גישה מוקדמת (בהסכמתך)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. נתוני שיחות</h2>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <ul className="list-disc space-y-2 ps-5 leading-7">
              <li>הודעות הצ&apos;אט שלך <strong>נשמרות במסד הנתונים</strong> שלנו כדי לשמור את היסטוריית השיחה בין סשנים</li>
              <li>השיחות <strong>נשלחות ל-Google Gemini AI</strong> לצורך עיבוד (חלים תנאי Google)</li>
              <li>אנו עשויים לסקור שיחות <strong>באופן אנונימי</strong> (ללא פרטים מזהים) לצורך שיפור איכות השירות</li>
              <li>השיחות <strong>אינן נמכרות</strong> לצדדים שלישיים</li>
              <li>השיחות <strong>אינן משמשות לאימון מודלי AI</strong> — אנו משתמשים ב-API של Google, לא במודל עצמאי</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. שירותי צד שלישי</h2>
          <p className="leading-7">אנו משתפים מידע עם ספקי שירות לצורך תפעול הפלטפורמה:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pe-4 text-start font-medium">שירות</th>
                  <th className="py-2 pe-4 text-start font-medium">מטרה</th>
                  <th className="py-2 text-start font-medium">מידע</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="py-2 pe-4">Google Gemini AI</td>
                  <td className="py-2 pe-4">עיבוד שפה טבעית</td>
                  <td className="py-2">תוכן שיחות</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pe-4">PostHog (אירופה)</td>
                  <td className="py-2 pe-4">אנליטיקת מוצר</td>
                  <td className="py-2">אירועי שימוש</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pe-4">Neon PostgreSQL</td>
                  <td className="py-2 pe-4">אחסון מסד נתונים</td>
                  <td className="py-2">כלל הנתונים המאוחסנים</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pe-4">Resend</td>
                  <td className="py-2 pe-4">שליחת אימיילים</td>
                  <td className="py-2">כתובת אימייל, שם</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 pe-4">Upstash Redis</td>
                  <td className="py-2 pe-4">הגבלת קצב שימוש</td>
                  <td className="py-2">מזהי בקשות</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="leading-7">אנו לא מוכרים מידע אישי לצדדים שלישיים.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. שמירת מידע</h2>
          <ul className="list-disc space-y-1 ps-5 leading-7">
            <li><strong>סשנים:</strong> פגים לאחר 7 ימים</li>
            <li><strong>היסטוריית שיחות:</strong> נשמרת עד שתבקש מחיקה</li>
            <li><strong>נכסים שמורים:</strong> נשמרים עד שתמחק אותם</li>
            <li><strong>אירועי אנליטיקה:</strong> בהתאם למדיניות PostHog (ברירת מחדל: 90 יום)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. הזכויות שלך</h2>
          <p className="leading-7">בהתאם לחוק הגנת הפרטיות, התשמ&quot;א-1981, עומדות לך הזכויות הבאות:</p>
          <ul className="list-disc space-y-1 ps-5 leading-7">
            <li><strong>זכות עיון:</strong> לעיין במידע האישי שלך</li>
            <li><strong>זכות תיקון:</strong> לתקן מידע שגוי</li>
            <li><strong>זכות מחיקה:</strong> לבקש מחיקת המידע שלך</li>
            <li><strong>זכות ביטול הסכמה:</strong> לבטל הסכמה לקבלת דיוור</li>
          </ul>
          <p className="leading-7">
            לצורך מימוש הזכויות שלך, פנה אלינו בכתובת:{" "}
            <a href="mailto:support@matama.co.il" className="text-primary hover:underline">support@matama.co.il</a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. אבטחת מידע</h2>
          <ul className="list-disc space-y-1 ps-5 leading-7">
            <li>המידע מאוחסן במסדי נתונים מוצפנים</li>
            <li>סיסמאות מוצפנות (hash) — אין לנו גישה לסיסמה שלך</li>
            <li>כל התקשורת מוצפנת באמצעות HTTPS</li>
            <li>טוקני סשן פגים לאחר 7 ימים</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. עוגיות (Cookies)</h2>
          <ul className="list-disc space-y-1 ps-5 leading-7">
            <li><strong>עוגיות סשן:</strong> HTTP-only cookies לצורך אימות — נדרשות לתפקוד השירות</li>
            <li><strong>אנליטיקה:</strong> PostHog עוקבת אחרי אירועי שימוש. השרתים ממוקמים באירופה.</li>
            <li>ניתן לחסום עוגיות דרך הגדרות הדפדפן, אך הדבר עשוי לפגוע בתפקוד השירות</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. גיל מינימלי</h2>
          <p className="leading-7">השירות אינו מיועד לשימוש על ידי מי שטרם מלאו לו 18 שנים.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. שינויים במדיניות</h2>
          <p className="leading-7">
            עדכונים למדיניות זו יפורסמו בעמוד זה עם תאריך עדכון. שינויים מהותיים יועברו בהתראה באימייל.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">12. דין חל</h2>
          <p className="leading-7">
            על מדיניות זו חל הדין הישראלי. סמכות השיפוט הבלעדית נתונה לבתי המשפט בתל אביב-יפו.
          </p>
        </section>

        <footer className="border-t border-border pt-6 text-sm text-muted-foreground">
          <p>
            לשאלות בנוגע למדיניות הפרטיות, ניתן לפנות אלינו בכתובת:{" "}
            <a href="mailto:support@matama.co.il" className="text-primary hover:underline">
              support@matama.co.il
            </a>
          </p>
          <p className="mt-2">
            <Link href="/terms" className="text-primary hover:underline">תנאי שימוש</Link>
          </p>
        </footer>
      </article>
    </div>
  )
}
