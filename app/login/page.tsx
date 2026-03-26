"use client"

import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-xl border border-border p-8 shadow-xs">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">דירות</h1>
            <p className="text-sm text-muted-foreground mt-1">
              התחברות לחשבון
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-sm text-muted-foreground mt-6">
            אין לך חשבון?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium hover:underline"
            >
              הרשמה
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
