# Investor Profile — PRD

## Problem Statement

Every user gets the same generic analysis regardless of their investment goals. A first-time buyer looking for an apartment to live in gets the same output as a seasoned investor looking for short-term PB flips. Without knowing the user's context, the agent can't prioritize the right factors, flag relevant risks, or tailor recommendations. This makes the analysis less actionable and the product feel impersonal.

## Goals

1. **Personalized analysis** — agent tailors scoring interpretation, risk flags, and recommendations based on user's investment profile (type, timeline, budget, experience, areas)
2. **Natural onboarding** — user profiles are built through conversation, not forms. Zero friction on first use.
3. **Persistent context** — preferences survive across sessions. User doesn't repeat themselves every conversation.
4. **Visible profile** — user can see and understand what the agent knows about them (replaces unused thread sidebar).

## Non-Goals

- **Explicit settings form / questionnaire** — no forms, the agent asks naturally
- **Thread management** — threads remain as-is (not working, low priority)
- **Multi-profile support** — one profile per user, no "personas" or investment scenarios
- **Profile sharing** — profiles are private, not shareable between users

---

## How It Works

### Flow

1. **User asks a question** (e.g., "מה הסטטוס של החשמונאים 22?")
2. **Agent performs the analysis** as normal (tools, scoring, etc.)
3. **Agent delivers results** with the score card and structured analysis
4. **Agent notices missing profile data** and asks a natural follow-up:
   > "אגב, האם אתה מחפש להשקיע לטווח ארוך או קצר? זה ישפיע על הניתוח שלי."
5. **User responds** naturally in chat
6. **Agent saves the preference** using a new `updateProfile` tool
7. **Profile panel updates** in the sidebar to reflect the new info
8. **Future analyses** use the profile to tailor output

### What the agent should learn (profile fields)

| Field | Hebrew | Example values | When to ask |
|-------|--------|----------------|-------------|
| Investor type | סוג משקיע | מגורים / השקעה / שניהם | After first analysis |
| Investment horizon | אופק השקעה | קצר (1-3 שנים) / בינוני (3-7) / ארוך (7+) | After first analysis |
| Budget range | תקציב | עד 1.5M / 1.5-2.5M / 2.5-4M / 4M+ | When price data is relevant |
| Risk tolerance | סיכון | שמרני / מאוזן / אגרסיבי | After scoring shows risk factors |
| Areas of interest | אזורים | בת ים, חולון, פתח תקווה | From conversation context (auto-detect) |
| Experience level | ניסיון | ראשון / יש ניסיון / מנוסה | After first interaction |

### Agent behavior rules

- **Never ask all questions at once.** Maximum 1 profile question per response, always after delivering the analysis.
- **Detect before asking.** If the user says "אני מחפש דירה לגור בה", save `investorType: "מגורים"` without asking.
- **Don't ask if irrelevant.** Budget question only matters when discussing specific properties, not city-level overviews.
- **Inform the user.** When saving a preference: "שמרתי שאתה מחפש השקעה לטווח ארוך. אני אתחשב בזה בניתוחים הבאים."

---

## Technical Design

### Database: `user_preferences` table

```
user_preferences
├── id (text, PK)
├── userId (text, FK → user.id, unique)
├── investorType (text, nullable) — "מגורים" | "השקעה" | "שניהם"
├── investmentHorizon (text, nullable) — "קצר" | "בינוני" | "ארוך"
├── budgetRange (text, nullable) — "low" | "mid" | "high" | "premium"
├── riskTolerance (text, nullable) — "שמרני" | "מאוזן" | "אגרסיבי"
├── areasOfInterest (text, nullable) — JSON array of city names
├── experienceLevel (text, nullable) — "ראשון" | "יש ניסיון" | "מנוסה"
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

Follows the `savedProperties` pattern: userId FK with index, same context access via `context.agent.resourceId`.

### New Mastra tools

**`getProfile`** — reads the user's profile from DB. Agent calls this at the start of every conversation to have context.
- Input: none (userId from context)
- Output: `{ profile: UserPreferences | null }`

**`updateProfile`** — upserts a profile field. Agent calls this when it learns something new.
- Input: `{ field: string, value: string }`
- Output: `{ success: true, profile: UserPreferences }`

### Agent instruction additions

Add to the system prompt:
- At conversation start, call `getProfile` to load user context
- Use profile to tailor analysis (e.g., for short-term investors, emphasize stage and timeline; for long-term, emphasize infrastructure and area momentum)
- After delivering analysis, if key profile fields are missing, ask ONE follow-up
- When user mentions preferences naturally, call `updateProfile`

### Sidebar: Profile panel (replaces thread list)

Replace the current thread list sidebar with a profile panel:
- Shows current profile fields with their values
- Empty fields show as "טרם נקבע" (not yet set)
- Read-only — user edits via conversation, not forms
- Shows a small "שאל אותי" prompt at the bottom encouraging the user to update preferences via chat

---

## User Stories

### As a new user
- I want the agent to analyze my first question immediately without asking me 10 questions first
- I want the agent to naturally ask about my investment goals after I get my first analysis
- I want to see what the agent knows about me in the sidebar

### As a returning user
- I want the agent to remember that I'm a long-term investor looking in Bat Yam
- I want analysis tailored to my profile without re-explaining my situation
- I want to update my preferences by telling the agent ("actually, I'm now also looking in Holon")

---

## Requirements

### Must-Have (P0)
- [ ] `user_preferences` table in DB (schema + migration)
- [ ] `getProfile` tool — agent loads profile at conversation start
- [ ] `updateProfile` tool — agent saves preferences when detected
- [ ] Agent instructions: profile-aware analysis, natural follow-up questions
- [ ] Profile detection from natural language (auto-save without asking)

### Nice-to-Have (P1)
- [ ] Sidebar profile panel (replace thread list)
- [ ] Profile influences scoring interpretation (e.g., short-term investors see stage-weighted analysis)
- [ ] "מה אתה יודע עליי?" response — agent summarizes stored profile

### Future (P2)
- [ ] Profile-based welcome suggestions (show different starter questions based on profile)
- [ ] Profile completeness indicator
- [ ] Export profile data (per privacy policy rights)

---

## Success Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Profile completion (3+ fields filled) | 60% of active users | 30 days |
| Personalized analysis delivered | 80% of sessions for profiled users | 30 days |
| Profile question response rate | >70% when asked | 14 days |

## Open Questions

| Question | Owner |
|----------|-------|
| Should the profile be injected into the system prompt dynamically, or passed as tool context at conversation start? | Engineering |
| Should `getProfile` be called automatically by the framework, or should the agent decide when to call it? | Engineering |
| How should profile data affect the score card display? (e.g., highlight factors that matter most for the user's profile) | Product + Design |
