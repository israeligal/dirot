"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const { error } = await signIn.email({
      email,
      password,
      callbackURL: "/",
    })

    if (error) {
      toast.error(error.message || "ההתחברות נכשלה")
      setIsLoading(false)
      return
    }

    router.push("/")
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          autoComplete="current-password"
          dir="ltr"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "מתחבר..." : "התחברות"}
      </Button>
    </form>
  )
}
