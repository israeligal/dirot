"use client"

import { motion } from "motion/react"
import { Search, Shield, GitCompareArrows } from "lucide-react"

const FEATURES = [
  {
    icon: Search,
    title: "ניתוח פרויקט",
    description:
      "ציון השקעה 0-100 עם דירוג A-F, מבוסס על 7 פקטורים: שלב תכנוני, תשתיות, יזם, מחירי שוק, תחבורה, ריכוזיות פרויקטים, ומצב עירוני.",
    color: "from-primary/10 to-primary/5",
  },
  {
    icon: Shield,
    title: "מחקר יזם",
    description:
      "בדיקת רישום קבלני, אתרי בנייה פעילים, צווי בטיחות, התראות, ומוניטין ברשת — הכל ממקורות רשמיים ופתוחים.",
    color: "from-blue-500/10 to-blue-500/5",
  },
  {
    icon: GitCompareArrows,
    title: "השוואת נכסים",
    description:
      "השוואה צד-לצד של 2-4 כתובות: ציון, שלב תכנוני, יזם, תשתיות, סיכונים — בלחיצה אחת.",
    color: "from-amber-500/10 to-amber-500/5",
  },
]

export function FeatureCards() {
  return (
    <section id="features" className="bg-muted/20 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            מה הסוכן יכול לעשות
          </h2>
          <p className="text-muted-foreground">
            כלים חכמים לניתוח השקעות פינוי בינוי
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{
                y: -4,
                transition: { duration: 0.2 },
              }}
              className="group cursor-default overflow-hidden rounded-xl border border-border bg-white p-6 shadow-xs transition-shadow hover:shadow-md"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color}`}
              >
                <feature.icon className="h-5 w-5 text-foreground/80" />
              </div>

              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
