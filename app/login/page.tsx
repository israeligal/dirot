"use client"

import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { EarlyAccessForm } from "@/components/auth/early-access-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* Login card */}
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

        {/* Early access card */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
          <div className="text-center mb-4">
            <p className="text-sm font-medium text-foreground">
              מעוניינים בגישה מוקדמת?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              השאירו פרטים ונעדכן אתכם כשהפלטפורמה תהיה פתוחה
            </p>
          </div>
          <EarlyAccessForm />
        </div>
      </div>
    </div>
  )
}
