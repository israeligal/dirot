"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useSpring, useInView } from "motion/react"

const STATS = [
  { value: 37, suffix: "+", label: "פרויקטי פינוי בינוי מאושרים בבת ים" },
  { value: 20, suffix: "+", label: "מקורות מידע ממשלתיים ושוק" },
  { value: 8500, suffix: "+", label: "יחידות דיור חדשות מתוכננות" },
  { value: 7, suffix: "", label: "שאילתות מקביליות לכל כתובת" },
]

function AnimatedCounter({
  value,
  suffix,
  isInView,
}: {
  value: number
  suffix: string
  isInView: boolean
}) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (isInView) {
      spring.set(value)
    }
  }, [isInView, spring, value])

  useEffect(() => {
    const unsubscribe = spring.on("change", (v) => {
      setDisplay(Math.round(v))
    })
    return unsubscribe
  }, [spring])

  return (
    <span className="tabular-nums">
      {display.toLocaleString("he-IL")}
      {suffix}
    </span>
  )
}

export function Stats() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="px-6 py-24" ref={ref}>
      <div className="mx-auto max-w-4xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="mb-2 text-4xl font-extrabold text-primary md:text-5xl">
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  isInView={isInView}
                />
              </div>
              <div className="text-sm leading-snug text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
