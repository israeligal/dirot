"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useInView } from "motion/react"
import { Bot, User, CheckCircle2 } from "lucide-react"

const USER_MESSAGE = "מה הסטטוס של החשמונאים 22, בת ים?"

const AGENT_LINES = [
  "**סטטוס עדכני: החשמונאים 22, בת ים**",
  "",
  "הבניין ברחוב החשמונאים 22 נכלל בפרויקט פינוי בינוי שאושר תכנונית.",
  "",
  "**ממצאים:**",
  "- **מצב התכנית:** תכנית מאושרת — אחרי רישוי (2022)",
  "- **מספר תכנית:** 502-0612366",
  "- **היקף:** 68 דירות קיימות → 267 דירות חדשות",
  "- **בנייה ירוקה:** כן, הוגשה בקשה לשלב א׳",
  "- **בנייה פעילה:** לא — ממתין להיתר בנייה",
]

const SCORE_CARD = {
  score: 72,
  grade: "B",
  factors: [
    { label: "שלב תכנוני", value: "85/100" },
    { label: "תשתיות", value: "68/100" },
    { label: "יזם", value: "62/100" },
  ],
}

const TYPING_SPEED_MS = 25
const LINE_PAUSE_MS = 120
const USER_TYPING_SPEED_MS = 40

export function ChatDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [phase, setPhase] = useState<"idle" | "user-typing" | "thinking" | "agent-typing" | "score" | "done">("idle")
  const [userText, setUserText] = useState("")
  const [agentLines, setAgentLines] = useState<string[]>([])
  const [currentLineChars, setCurrentLineChars] = useState("")
  const [showScore, setShowScore] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isInView && phase === "idle") {
      setPhase("user-typing")
    }
  }, [isInView, phase])

  // User typing
  useEffect(() => {
    if (phase !== "user-typing") return
    let i = 0
    const interval = setInterval(() => {
      i++
      setUserText(USER_MESSAGE.slice(0, i))
      if (i >= USER_MESSAGE.length) {
        clearInterval(interval)
        setTimeout(() => setPhase("thinking"), 400)
      }
    }, USER_TYPING_SPEED_MS)
    return () => clearInterval(interval)
  }, [phase])

  // Thinking pause
  useEffect(() => {
    if (phase !== "thinking") return
    const timeout = setTimeout(() => setPhase("agent-typing"), 1500)
    return () => clearTimeout(timeout)
  }, [phase])

  // Agent typing — line by line, char by char
  useEffect(() => {
    if (phase !== "agent-typing") return
    let lineIdx = 0
    let charIdx = 0
    let cancelled = false

    function typeNext() {
      if (cancelled) return
      if (lineIdx >= AGENT_LINES.length) {
        setPhase("score")
        return
      }

      const line = AGENT_LINES[lineIdx]
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
  }, [phase])

  // Score card reveal
  useEffect(() => {
    if (phase !== "score") return
    const timeout = setTimeout(() => {
      setShowScore(true)
      setPhase("done")
    }, 400)
    return () => clearTimeout(timeout)
  }, [phase])

  // Auto-scroll within chat container only (not the page)
  useEffect(() => {
    const el = bottomRef.current
    if (!el) return
    const container = el.closest("[data-chat-scroll]")
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [userText, agentLines, currentLineChars, showScore])

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

            {/* Score card */}
            {showScore && (
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
                      {SCORE_CARD.grade}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-3xl font-bold tabular-nums text-foreground">
                      {SCORE_CARD.score}
                    </span>
                    <div className="flex-1">
                      <div className="h-2 w-full rounded-full bg-muted">
                        <motion.div
                          className="h-2 rounded-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${SCORE_CARD.score}%` }}
                          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    {SCORE_CARD.factors.map((f) => (
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

            <div ref={bottomRef} />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function AgentLine({ text }: { text: string }) {
  if (!text) return <div className="h-2" />

  // Simple bold markdown rendering
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
