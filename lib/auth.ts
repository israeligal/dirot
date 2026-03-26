import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { db } from "@/app/lib/db"
import * as schema from "@/app/lib/schema"

const ALLOWED_EMAILS = [
  "israeligal2@gmail.com",
  "talia6990@gmail.com",
]

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!ALLOWED_EMAILS.includes(user.email)) {
            throw new Error("ההרשמה מוגבלת למשתמשים מוזמנים בלבד")
          }
          return { data: user }
        },
      },
    },
  },

  rateLimit: {
    window: 120,
    max: 10,
    customRules: {
      "/sign-in/email": { window: 120, max: 3 },
      "/sign-up/email": { window: 120, max: 3 },
    },
  },

  trustedOrigins: [process.env.BETTER_AUTH_URL!],

  plugins: [nextCookies()],

  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
})

export type Session = typeof auth.$Infer.Session

export async function getSession() {
  const { headers } = await import("next/headers")
  return auth.api.getSession({ headers: await headers() })
}
