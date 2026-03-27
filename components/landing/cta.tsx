"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Loader2 } from "lucide-react"

export function CTA() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const name = formData.get("name") as string

    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      })

      if (!res.ok) {
        const text = await res.text()
        const errorMsg = text ? JSON.parse(text).error : "שגיאה בשליחת הבקשה"
        throw new Error(errorMsg || "שגיאה בשליחת הבקשה")
      }

      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בשליחת הבקשה")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section id="cta" className="px-6 py-24">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">תודה רבה!</h2>
              <p className="text-muted-foreground">
                נעדכן אותך ברגע שהפלטפורמה תהיה פתוחה.
              </p>
            </motion.div>
          ) : (
            <>
              <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
                מעוניינים לנסות?
              </h2>
              <p className="mb-8 text-muted-foreground">
                השאירו פרטים ונעדכן אתכם כשהפלטפורמה תהיה פתוחה
              </p>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3"
              >
                <Input
                  name="name"
                  type="text"
                  placeholder="שם"
                  required
                  autoComplete="name"
                  className="h-12 text-base"
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="אימייל"
                  required
                  autoComplete="email"
                  dir="ltr"
                  className="h-12 text-base"
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="h-12 text-base font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      שולח...
                    </>
                  ) : (
                    "קבל גישה מוקדמת"
                  )}
                </Button>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </form>
            </>
          )}
        </motion.div>
      </div>
    </section>
  )
}
