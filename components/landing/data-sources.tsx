"use client"

import { motion } from "motion/react"
import {
  Building2,
  MapPin,
  HardHat,
  Landmark,
  Train,
  GraduationCap,
  FileSearch,
  Globe,
  BarChart3,
  Scale,
  Hammer,
  TreePine,
  Home,
  TrendingUp,
  ClipboardList,
  Database,
} from "lucide-react"

const DATA_SOURCES = [
  { icon: Building2, label: "פרויקטי פינוי בינוי", desc: "מאגר התחדשות עירונית" },
  { icon: MapPin, label: "רשות התכנון (XPLAN)", desc: "תכניות בניין ערים" },
  { icon: HardHat, label: "אתרי בנייה פעילים", desc: "פיקוח ובטיחות" },
  { icon: Landmark, label: "דירה בהנחה", desc: "הגרלות מחיר למשתכן" },
  { icon: Train, label: "תחבורה ציבורית", desc: "תחנות אוטובוס ורכבת קלה" },
  { icon: GraduationCap, label: "מוסדות חינוך", desc: "בתי ספר וגני ילדים" },
  { icon: FileSearch, label: "קבלנים רשומים", desc: "מרשם הקבלנים" },
  { icon: Globe, label: "מחקר יזמים", desc: "חיפוש רשת ומוניטין" },
  { icon: BarChart3, label: "נתוני שוק (מדלן)", desc: "מחירים ומגמות" },
  { icon: Scale, label: "עלויות פיתוח", desc: "היטלי השבחה ומסים" },
  { icon: Hammer, label: "התקדמות בנייה", desc: "מעקב שלבי ביצוע" },
  { icon: TreePine, label: "בנייה ירוקה", desc: "תקן 5281 ודירוגים" },
  { icon: Home, label: "דיור ציבורי", desc: "מלאי ופנויות" },
  { icon: TrendingUp, label: "תשתיות לאומיות", desc: "כבישים, מסילות, תכניות" },
  { icon: ClipboardList, label: "שמאים ומתווכים", desc: "מומחי נדל״ן באזור" },
  { icon: Database, label: "אזורים סטטיסטיים", desc: "נתוני שכונות ודמוגרפיה" },
]

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export function DataSources() {
  return (
    <section id="data-sources" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            20+ מקורות מידע
          </h2>
          <p className="mx-auto max-w-lg text-muted-foreground">
            הסוכן שולף נתונים ממאגרי מידע ממשלתיים, רשות התכנון, ונתוני שוק
            — הכל בזמן אמת
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
        >
          {DATA_SOURCES.map((source) => (
            <motion.div
              key={source.label}
              variants={item}
              className="group flex items-start gap-3 rounded-lg border border-transparent bg-muted/30 p-3.5 transition-colors hover:border-border hover:bg-muted/60"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary transition-colors group-hover:bg-primary/15">
                <source.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">
                  {source.label}
                </div>
                <div className="text-xs text-muted-foreground">{source.desc}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
