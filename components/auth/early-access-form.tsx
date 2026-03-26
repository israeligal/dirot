"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"

export function EarlyAccessForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const name = formData.get("name") as string

    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "שגיאה בשליחת הבקשה")
        setIsLoading(false)
        return
      }

      setIsSubmitted(true)
    } catch {
      toast.error("שגיאה בשליחת הבקשה")
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <CheckCircle2 className="size-8 text-emerald-500" />
        <p className="text-sm font-medium text-foreground">הבקשה נשלחה בהצלחה</p>
        <p className="text-xs text-muted-foreground">
          ניצור איתך קשר כשהגישה תהיה זמינה
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label htmlFor="ea-name" className="text-sm font-medium text-foreground">
          שם
        </label>
        <Input
          id="ea-name"
          name="name"
          type="text"
          placeholder="השם שלך"
          autoComplete="name"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="ea-email" className="text-sm font-medium text-foreground">
          אימייל
        </label>
        <Input
          id="ea-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          dir="ltr"
        />
      </div>

      <Button type="submit" variant="outline" disabled={isLoading} className="w-full">
        {isLoading ? "שולח..." : "בקשת גישה מוקדמת"}
      </Button>
    </form>
  )
}
