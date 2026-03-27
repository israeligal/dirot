"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, useInView, AnimatePresence } from "motion/react"
import { Bot, User, CheckCircle2, Building2, MapPin, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScoreCard {
  score: number
  grade: string
  factors: { label: string; value: string }[]
}

interface Conversation {
  id: string
  label: string
  icon: typeof Building2
  userMessage: string
  agentLines: string[]
  scoreCard?: ScoreCard
}

const CONVERSATIONS: Conversation[] = [
  {
    id: "building",
    label: "ניתוח בניין",
    icon: Building2,
    userMessage: "מה הסטטוס של החשמונאים 22, בת ים?",
    agentLines: [
      "**סטטוס עדכני: החשמונאים 22, בת ים**",
      "",
      "הבניין נכלל בפרויקט פינוי בינוי במתחם ״החשמונאים/יוספטל״ שאושר תכנונית.",
      "",
      "**ממצאים:**",
      "- **מצב התכנית:** תכנית מאושרת — אחרי רישוי (2022)",
      "- **מספר תכנית:** 502-0612366",
      "- **היקף:** 68 דירות קיימות → 267 דירות חדשות (+61 תוספתיות)",
      "- **מסלול:** מיסוי — הטבות מס זמינות",
      "- **תחבורה:** תחנת רכבת קלה ״יוספטל״ (קו אדום) צמודה לפרויקט",
      "",
      "**חוזקות:** ריכוזיות גבוהה (37 פרויקטים בבת ים), רכבת קלה פעילה, מחיר נמוך יחסית.",
      "**חולשה:** לא זוהה יזם/קבלן — ציון יזם 50/100 (פער מידע).",
    ],
    scoreCard: {
      score: 74,
      grade: "B",
      factors: [
        { label: "תחבורה ציבורית", value: "95" },
        { label: "תמיכת רשות", value: "80" },
        { label: "שלב תכנוני", value: "75" },
        { label: "מומנטום עירוני", value: "70" },
      ],
    },
  },
  {
    id: "city",
    label: "פרויקטים בעיר",
    icon: MapPin,
    userMessage: "ספר לי על פרויקטי פינוי בינוי בפתח תקווה",
    agentLines: [
      "**פרויקטי פינוי בינוי — פתח תקווה**",
      "",
      "אותרו **37 תכניות מאושרות** ברחבי העיר — 8,225 דירות קיימות → 29,360 מוצעות.",
      "",
      "**הפרויקטים הגדולים:**",
      "- **עמישב טבריה:** 277 → 1,042 יח״ד (תכנון סטטוטורי)",
      "- **ארגוב:** 240 → 913 יח״ד (מאושרת לפני מימוש)",
      "- **אנסקי:** 255 → 822 יח״ד (מאושרת לפני מימוש)",
      "- **יד לבנים:** 236 → 826 יח״ד (מאושרת לפני מימוש)",
      "- **יעקב קרול:** 96 → 359 יח״ד (אחרי רישוי)",
      "",
      "**תחבורה:** 9 תחנות רכבת קלה באזור (קו אדום + ירוק), 563 תחנות אוטובוס.",
      "**אתרי בנייה:** 284 אתרים פעילים ברחבי העיר.",
    ],
  },
  {
    id: "potential",
    label: "אזורים מומלצים",
    icon: TrendingUp,
    userMessage: "איזה ערים הכי מתקדמות בפינוי בינוי?",
    agentLines: [
      "**דירוג ערים לפי מספר פרויקטי פינוי בינוי מאושרים:**",
      "",
      "- **ירושלים:** 164 פרויקטים (14,040 → 58,670 יח״ד)",
      "- **רמת גן:** 76 פרויקטים (5,208 → 16,429 יח״ד)",
      "- **תל אביב:** 58 פרויקטים (7,003 → 21,501 יח״ד)",
      "- **חיפה:** 42 פרויקטים (4,808 → 20,555 יח״ד)",
      "- **נתניה:** 42 פרויקטים (4,295 → 16,961 יח״ד)",
      "- **פתח תקווה:** 37 פרויקטים (8,225 → 29,360 יח״ד)",
      "- **בת ים:** 37 פרויקטים (7,377 → 25,816 יח״ד)",
      "- **חולון:** 24 פרויקטים (4,994 → 15,844 יח״ד)",
      "- **גבעתיים:** 24 פרויקטים (6,958 → 18,161 יח״ד)",
      "",
      "**יחס הכפלה הגבוה ביותר:** פתח תקווה (x3.6), חיפה (x4.3), נתניה (x3.9) — מצביע על פוטנציאל צמיחה.",
    ],
  },
]

const TYPING_SPEED_MS = 20
const LINE_PAUSE_MS = 80
const USER_TYPING_SPEED_MS = 35

export function ChatDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const [activeTab, setActiveTab] = useState(0)
  const [phase, setPhase] = useState<"idle" | "user-typing" | "thinking" | "agent-typing" | "score" | "done">("idle")
  const [userText, setUserText] = useState("")
  const [agentLines, setAgentLines] = useState<string[]>([])
  const [currentLineChars, setCurrentLineChars] = useState("")
  const [showScore, setShowScore] = useState(false)
  const [playedTabs, setPlayedTabs] = useState<Set<number>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)

  const conversation = CONVERSATIONS[activeTab]

  const showInstantly = useCallback((index: number) => {
    const conv = CONVERSATIONS[index]
    setUserText(conv.userMessage)
    setAgentLines(conv.agentLines)
    setCurrentLineChars("")
    setShowScore(!!conv.scoreCard)
    setPhase("done")
  }, [])

  const resetAndPlay = useCallback((index: number) => {
    setUserText("")
    setAgentLines([])
    setCurrentLineChars("")
    setShowScore(false)
    setPhase("user-typing")
  }, [])

  // Start on first view
  useEffect(() => {
    if (isInView && phase === "idle") {
      setPhase("user-typing")
    }
  }, [isInView, phase])

  // User typing
  useEffect(() => {
    if (phase !== "user-typing") return
    let i = 0
    const msg = conversation.userMessage
    const interval = setInterval(() => {
      i++
      setUserText(msg.slice(0, i))
      if (i >= msg.length) {
        clearInterval(interval)
        setTimeout(() => setPhase("thinking"), 400)
      }
    }, USER_TYPING_SPEED_MS)
    return () => clearInterval(interval)
  }, [phase, conversation.userMessage])

  // Thinking pause
  useEffect(() => {
    if (phase !== "thinking") return
    const timeout = setTimeout(() => setPhase("agent-typing"), 1200)
    return () => clearTimeout(timeout)
  }, [phase])

  // Agent typing
  useEffect(() => {
    if (phase !== "agent-typing") return
    const lines = conversation.agentLines
    let lineIdx = 0
    let charIdx = 0
    let cancelled = false

    function typeNext() {
      if (cancelled) return
      if (lineIdx >= lines.length) {
        if (conversation.scoreCard) {
          setPhase("score")
        } else {
          setPlayedTabs((prev) => new Set(prev).add(activeTab))
          setPhase("done")
        }
        return
      }

      const line = lines[lineIdx]
      if (charIdx < line.length) {
        charIdx++
        setCurrentLineChars(line.slice(0, charIdx))
        setTimeout(typeNext, TYPING_SPEED_MS)
      } else {
        setAgentLines((prev) => [...prev, line])
        setCurrentLineChars("")
        lineIdx++
        charIdx = 0
        setTimeout(typeNext, LINE_PAUSE_MS)
      }
    }

    typeNext()
    return () => { cancelled = true }
  }, [phase, conversation.agentLines, conversation.scoreCard])

  // Score card reveal
  useEffect(() => {
    if (phase !== "score") return
    const timeout = setTimeout(() => {
      setShowScore(true)
      setPlayedTabs((prev) => new Set(prev).add(activeTab))
      setPhase("done")
    }, 400)
    return () => clearTimeout(timeout)
  }, [phase, activeTab])

  // Auto-scroll within chat container only
  useEffect(() => {
    const el = bottomRef.current
    if (!el) return
    const container = el.closest("[data-chat-scroll]")
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [userText, agentLines, currentLineChars, showScore])

  const handleTabSwitch = (index: number) => {
    if (index === activeTab) return
    setActiveTab(index)
    if (playedTabs.has(index)) {
      showInstantly(index)
    } else {
      resetAndPlay(index)
    }
  }

  return (
    <section id="demo" className="px-6 py-12" ref={ref}>
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            ראה את הסוכן בפעולה
          </h2>
          <p className="text-muted-foreground">
            שאל שאלה בעברית — קבל ניתוח מקיף תוך שניות
          </p>
        </motion.div>

        {/* Conversation tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-4 flex justify-center gap-2"
        >
          {CONVERSATIONS.map((conv, i) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => handleTabSwitch(i)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                i === activeTab
                  ? "border-primary/30 bg-primary/8 text-primary"
                  : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70",
              )}
            >
              <conv.icon className="h-3.5 w-3.5" />
              {conv.label}
            </button>
          ))}
        </motion.div>

        {/* Chat window mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="overflow-hidden rounded-xl border border-border bg-white shadow-lg"
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <span className="mr-3 text-xs font-medium text-muted-foreground">
              דירות — אנליסט פינוי בינוי
            </span>
          </div>

          {/* Chat messages */}
          <div data-chat-scroll className="flex h-[420px] flex-col gap-4 overflow-y-auto p-5 md:h-[480px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                {/* User message */}
                {userText && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="rounded-lg bg-muted/50 px-4 py-2.5 text-sm text-foreground">
                      {userText}
                      {phase === "user-typing" && (
                        <span className="mr-0.5 inline-block h-4 w-0.5 animate-pulse bg-foreground" />
                      )}
                    </div>
                  </div>
                )}

                {/* Thinking indicator */}
                {phase === "thinking" && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-4 py-2.5">
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40 [animation-delay:0ms]" />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40 [animation-delay:150ms]" />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40 [animation-delay:300ms]" />
                    </div>
                  </div>
                )}

                {/* Agent response */}
                {(agentLines.length > 0 || currentLineChars) && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 text-sm leading-relaxed text-foreground">
                      {agentLines.map((line, i) => (
                        <AgentLine key={i} text={line} />
                      ))}
                      {currentLineChars && <AgentLine text={currentLineChars} />}
                      {phase === "agent-typing" && (
                        <span className="inline-block h-4 w-0.5 animate-pulse bg-primary/60" />
                      )}
                    </div>
                  </div>
                )}

                {/* Score card (only for building analysis) */}
                {showScore && conversation.scoreCard && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="mr-10 overflow-hidden rounded-lg border border-border"
                  >
                    <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        ציון השקעה
                      </span>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-600">
                          {conversation.scoreCard.grade}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="text-3xl font-bold tabular-nums text-foreground">
                          {conversation.scoreCard.score}
                        </span>
                        <div className="flex-1">
                          <div className="h-2 w-full rounded-full bg-muted">
                            <motion.div
                              className="h-2 rounded-full bg-blue-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${conversation.scoreCard.score}%` }}
                              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        {conversation.scoreCard.factors.map((f) => (
                          <div key={f.label} className="flex-1">
                            <div className="text-[11px] text-muted-foreground">{f.label}</div>
                            <div className="text-sm font-semibold tabular-nums text-foreground">
                              {f.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>
        </motion.div>

        <p className="mt-3 text-center text-xs text-muted-foreground/60">
          נתונים אמיתיים ממאגרי מידע ממשלתיים (data.gov.il) ורשות התכנון
        </p>
      </div>
    </section>
  )
}

function AgentLine({ text }: { text: string }) {
  if (!text) return <div className="h-2" />

  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <p>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  )
}
