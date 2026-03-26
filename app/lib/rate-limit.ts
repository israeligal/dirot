import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

type RateLimitEndpoint = "chat" | "early-access" | "auth"

const RATE_LIMIT_CONFIGS: Record<
  RateLimitEndpoint,
  { requests: number; window: `${number} ${"s" | "m" | "h" | "d"}` }
> = {
  chat: { requests: 10, window: "1 m" },
  "early-access": { requests: 5, window: "1 m" },
  auth: { requests: 20, window: "1 m" },
}

const rateLimiters = redis
  ? (Object.fromEntries(
      Object.entries(RATE_LIMIT_CONFIGS).map(([endpoint, config]) => [
        endpoint,
        new Ratelimit({
          redis: redis,
          limiter: Ratelimit.slidingWindow(config.requests, config.window),
          analytics: true,
          prefix: endpoint,
        }),
      ]),
    ) as Record<RateLimitEndpoint, Ratelimit>)
  : null

let warnedOnce = false

export async function checkRateLimit({
  identifier,
  endpoint = "chat",
}: {
  identifier: string
  endpoint?: RateLimitEndpoint
}) {
  if (!rateLimiters) {
    if (!warnedOnce) {
      console.warn(
        "[rate-limit] Not configured — set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
      )
      warnedOnce = true
    }
    return { success: true, limit: 0, remaining: 0, reset: 0 }
  }

  const limiter = rateLimiters[endpoint]
  if (!limiter) {
    console.warn(`[rate-limit] Unknown endpoint: ${endpoint}`)
    return { success: true, limit: 0, remaining: 0, reset: 0 }
  }

  return await limiter.limit(identifier)
}
