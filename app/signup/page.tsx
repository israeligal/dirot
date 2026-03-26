"use client"

import Link from "next/link"
import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-xl border border-border p-8 shadow-xs">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">דירות</h1>
            <p className="text-sm text-muted-foreground mt-1">
              יצירת חשבון
            </p>
          </div>

          <SignupForm />

          <p className="text-center text-sm text-muted-foreground mt-6">
            כבר יש לך חשבון?{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              התחברות
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
