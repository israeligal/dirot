"use client"

import { motion } from "motion/react"
import { MessageSquare, Cpu, FileText } from "lucide-react"

const STEPS = [
  {
    icon: MessageSquare,
    title: "שאל שאלה",
    description: "כתוב כתובת, שם יזם, או כל שאלה על פינוי בינוי. הסוכן מתמחה בתחום ומבין הקשר.",
  },
  {
    icon: Cpu,
    title: "ניתוח מקצועי מ-20+ מקורות",
    description: "סוכן AI שמתמחה בפינוי בינוי — מנתח תכניות, יזמים, בטיחות, מחירים ותשתיות במקביל.",
  },
  {
    icon: FileText,
    title: "קבל דוח השקעה מלא",
    description: "ציון השקעה 0-100, ניתוח סיכונים, שלב תכנוני, בדיקת יזם, והשוואת נכסים — כמו אנליסט מקצועי.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-muted/20 px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            סוכן AI שמתמחה בפינוי בינוי
          </h2>
          <p className="mx-auto max-w-lg text-muted-foreground">
            לא צ׳אטבוט כללי — סוכן שמבין את עולם ההתחדשות העירונית, מנתח תכניות,
            מזהה סיכונים, ויודע לתת תמונה מלאה על כל פרויקט
          </p>
        </motion.div>

        <div className="relative flex flex-col gap-12 md:flex-row md:gap-8">
          {/* Connecting line (desktop) */}
          <motion.div
            className="absolute top-12 right-[16.7%] left-[16.7%] hidden h-px bg-border md:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ transformOrigin: "right" }}
          />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="relative flex flex-1 flex-col items-center text-center"
            >
              {/* Step number + icon */}
              <div className="relative mb-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-white shadow-xs">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </div>
              </div>

              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="max-w-[250px] text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
