<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Dirot Next.js 16 App Router project. Client-side tracking is initialized via `instrumentation-client.ts` (Next.js 15.3+ pattern — no provider wrapper needed). All events are routed through a `/ingest` reverse proxy in `next.config.ts` to the EU PostHog cluster. Server-side events use a singleton `posthog-node` client in `lib/posthog-server.ts`. Users are identified on login/signup with `posthog.identify()` and unlinked on sign-out with `posthog.reset()`. Exceptions are captured automatically via `capture_exceptions: true` and manually via `posthog.captureException()`.

| Event | Description | File |
|---|---|---|
| `user_logged_in` | User successfully authenticated with email/password | `components/auth/login-form.tsx` |
| `login_failed` | User attempted to log in but authentication failed | `components/auth/login-form.tsx` |
| `user_signed_up` | New user successfully registered an account | `components/auth/signup-form.tsx` |
| `signup_failed` | User attempted to register but the signup failed | `components/auth/signup-form.tsx` |
| `early_access_requested` | Visitor submitted the early access signup form | `components/auth/early-access-form.tsx` |
| `user_signed_out` | User clicked the sign-out button from the main assistant view | `app/assistant.tsx` |
| `chat_message_sent` | User sent a message to the Pinui Binui analysis agent (server-side) | `app/api/chat/route.ts` |
| `plan_approved` | User approved the agent's proposed analysis plan (HITL step) | `components/tools/plan-approval.tsx` |
| `plan_rejected` | User rejected the agent's proposed analysis plan (HITL step) | `components/tools/plan-approval.tsx` |
| `user_input_submitted` | User submitted a freeform text input in response to an agent request | `components/tools/human-in-the-loop.tsx` |
| `early_access_signup_received` | Early access form submission processed successfully (server-side) | `app/api/early-access/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://eu.posthog.com/project/148327/dashboard/590108
- **Login → Chat activation funnel**: https://eu.posthog.com/project/148327/insights/FSaqp7lw
- **Daily active chatters (DAU)**: https://eu.posthog.com/project/148327/insights/ozcj77Uw
- **Early access signups vs activated users**: https://eu.posthog.com/project/148327/insights/RQJk42Xl
- **Plan approval rate**: https://eu.posthog.com/project/148327/insights/yjwLLigJ
- **Login failures & sign-outs (churn signals)**: https://eu.posthog.com/project/148327/insights/W1ypcYA2

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
