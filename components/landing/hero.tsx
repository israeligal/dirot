"use client"

import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { ArrowDown, Sparkles } from "lucide-react"

const STAGGER_DELAY = 0.15

export function Hero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 pt-16">
      {/* Subtle gradient background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, oklch(0.95 0.03 170 / 40%), transparent)",
        }}
      />

      {/* Decorative dots */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.3 0.05 170) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="mx-auto max-w-4xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary"
        >
          <Sparkles className="h-3.5 w-3.5" />
          גישה מוקדמת פתוחה
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: STAGGER_DELAY }}
          className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl"
        >
          הסוכן שמנתח את
          <br />
          <span className="text-primary">ההשקעה הבאה שלך</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: STAGGER_DELAY * 2 }}
          className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
        >
          סוכן בינה מלאכותית שמנתח פרויקטי פינוי בינוי מ-20+ מקורות מידע
          ממשלתיים ושוק — ונותן לך תמונה מלאה תוך שניות.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: STAGGER_DELAY * 3 }}
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <a href="#cta">
            <Button size="lg" className="h-12 px-8 text-base font-semibold">
              קבל גישה מוקדמת
            </Button>
          </a>
          <a href="#demo">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base font-semibold"
            >
              ראה איך זה עובד
            </Button>
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8"
      >
        <a href="#demo" className="flex flex-col items-center gap-2 text-muted-foreground/50">
          <span className="text-xs">גלול למטה</span>
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </a>
      </motion.div>
    </section>
  )
}
