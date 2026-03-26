"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signUp } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import posthog from "posthog-js"

export function SignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      toast.error("הסיסמאות לא תואמות")
      setIsLoading(false)
      return
    }

    const { error } = await signUp.email({
      name,
      email,
      password,
      callbackURL: "/",
    })

    if (error) {
      toast.error(error.message || "ההרשמה נכשלה")
      posthog.capture("signup_failed", { error_message: error.message })
      setIsLoading(false)
      return
    }

    posthog.identify(email, { email, name })
    posthog.capture("user_signed_up", { email, name })
    router.push("/")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          שם
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="השם שלך"
          required
          autoComplete="name"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          אימייל
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          dir="ltr"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-foreground"
        >
          סיסמה
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="********"
          required
          minLength={8}
          autoComplete="new-password"
          dir="ltr"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-foreground"
        >
          אימות סיסמה
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="********"
          required
          minLength={8}
          autoComplete="new-password"
          dir="ltr"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "יוצר חשבון..." : "יצירת חשבון"}
      </Button>
    </form>
  )
}
