# Investor Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a conversation-first investor profile system with a sidebar panel for viewing/editing preferences, tone selection, and custom instructions.

**Architecture:** New `user_preferences` DB table stores 6 profile fields + response style + custom instructions. Two new Mastra tools (`getProfile`, `updateProfile`) let the agent read/write profile data. A new `ProfileSidebar` component replaces the thread list sidebar with an editable profile panel. A new `PATCH /api/profile` endpoint handles direct edits from the sidebar UI.

**Tech Stack:** Drizzle ORM (schema), Neon PostgreSQL (storage), Mastra tools (agent access), React client component (sidebar UI), Next.js API route (direct edits)

**Specs:** `docs/specs/investor-profile-spec.md`, `docs/superpowers/specs/2026-03-28-investor-profile-ui-design.md`

---

### Task 1: Database Schema — `user_preferences` table

**Files:**
- Modify: `app/lib/schema.ts` (append after line 654)

- [ ] **Step 1: Add table definition to schema**

Add after the last table in `app/lib/schema.ts`:

```typescript
// --- User Investment Preferences ---

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    investorType: text("investorType"), // "מגורים" | "השקעה" | "שניהם"
    investmentHorizon: text("investmentHorizon"), // "קצר" | "בינוני" | "ארוך"
    riskTolerance: text("riskTolerance"), // "שמרני" | "מאוזן" | "אגרסיבי"
    budgetRange: text("budgetRange"), // "עד 1.5M" | "1.5-2.5M" | "2.5-4M" | "4M+"
    experienceLevel: text("experienceLevel"), // "ראשון" | "יש ניסיון" | "מנוסה"
    areasOfInterest: text("areasOfInterest"), // JSON array: ["בת ים","חולון"]
    responseStyle: text("responseStyle").default("מקצועי"), // "מקצועי" | "תמציתי" | "מפורט" | "חם" | "לימודי"
    customInstructions: text("customInstructions"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    index("idx_prefs_user").on(table.userId),
  ],
);
```

- [ ] **Step 2: Create the table in the database**

Run via the Neon MCP `sql` tool or a migration script:

```sql
CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "user" (id) ON DELETE CASCADE,
  "investorType" TEXT,
  "investmentHorizon" TEXT,
  "riskTolerance" TEXT,
  "budgetRange" TEXT,
  "experienceLevel" TEXT,
  "areasOfInterest" TEXT,
  "responseStyle" TEXT DEFAULT 'מקצועי',
  "customInstructions" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prefs_user ON user_preferences ("userId");
```

- [ ] **Step 3: Commit**

```bash
git add app/lib/schema.ts
git commit -m "feat: add user_preferences table for investor profile"
```

---

### Task 2: Mastra Tools — `getProfile` and `updateProfile`

**Files:**
- Create: `mastra/tools/profile.ts`
- Modify: `mastra/agents/dirot-agent.ts` (import + register tools + add instructions)

- [ ] **Step 1: Create profile tools file**

Create `mastra/tools/profile.ts`:

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  return neon(url);
}

function getUserId(context: { agent?: { resourceId?: string } }): string {
  const userId = context?.agent?.resourceId;
  if (!userId) throw new Error("User not authenticated — no resourceId in context");
  return userId;
}

const PROFILE_FIELDS = [
  "investorType",
  "investmentHorizon",
  "riskTolerance",
  "budgetRange",
  "experienceLevel",
  "areasOfInterest",
  "responseStyle",
  "customInstructions",
] as const;

interface UserProfile {
  investorType: string | null;
  investmentHorizon: string | null;
  riskTolerance: string | null;
  budgetRange: string | null;
  experienceLevel: string | null;
  areasOfInterest: string | null;
  responseStyle: string | null;
  customInstructions: string | null;
}

export const getProfile = createTool({
  id: "get-profile",
  description:
    "Load the user's investor profile (type, horizon, risk, budget, experience, areas, response style, custom instructions). Call at the start of each conversation to personalize analysis. Returns null fields for unset preferences.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    profile: z.record(z.string(), z.unknown()).nullable(),
  }),
  execute: async (_input, context) => {
    const userId = getUserId(context);
    const sql = getSql();

    const rows = await sql`
      SELECT "investorType", "investmentHorizon", "riskTolerance",
             "budgetRange", "experienceLevel", "areasOfInterest",
             "responseStyle", "customInstructions"
      FROM user_preferences
      WHERE "userId" = ${userId}
      LIMIT 1
    `;

    if (rows.length === 0) return { profile: null };

    return { profile: rows[0] as UserProfile };
  },
});

export const updateProfile = createTool({
  id: "update-profile",
  description:
    "Save or update a field in the user's investor profile. Call when the user mentions a preference (e.g., 'I'm looking for long-term investment') or when you learn something about them. Only update one field at a time. For areasOfInterest, pass a JSON array string.",
  inputSchema: z.object({
    field: z.enum(PROFILE_FIELDS).describe("Profile field to update"),
    value: z.string().describe("New value for the field"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async (input, context) => {
    const userId = getUserId(context);
    const sql = getSql();
    const now = new Date();

    try {
      await sql`
        INSERT INTO user_preferences (id, "userId", "${sql(input.field)}", "createdAt", "updatedAt")
        VALUES (${crypto.randomUUID()}, ${userId}, ${input.value}, ${now}, ${now})
        ON CONFLICT ("userId")
        DO UPDATE SET "${sql(input.field)}" = ${input.value}, "updatedAt" = ${now}
      `;

      return { success: true, message: `Updated ${input.field} to ${input.value}` };
    } catch (err) {
      console.error("[updateProfile] error:", err);
      return { success: false, message: "Failed to update profile." };
    }
  },
});
```

- [ ] **Step 2: Register tools in agent**

In `mastra/agents/dirot-agent.ts`, add import:

```typescript
import { getProfile, updateProfile } from "../tools/profile";
```

Add to the tools object (after the `// Market data` section):

```typescript
    // User profile
    getProfile,
    updateProfile,
```

- [ ] **Step 3: Add profile instructions to agent system prompt**

Add before the `SECURITY & BOUNDARIES:` section in the agent instructions:

```
USER PROFILE:
- At the START of every conversation, call getProfile to load user preferences.
- Use the profile to tailor your analysis:
  - Short-term investors: emphasize project stage, timeline, quick-win factors
  - Long-term investors: emphasize infrastructure, area momentum, cluster effect
  - Living (מגורים): emphasize neighborhood quality, schools, transport, livability
  - Budget constraints: flag properties outside range, highlight affordable options
- After delivering analysis, if key profile fields are missing (investorType, investmentHorizon), ask ONE natural follow-up. Never ask more than one profile question per response.
- When the user mentions preferences naturally ("אני מחפש לטווח ארוך"), call updateProfile immediately. Confirm: "שמרתי — אני אתחשב בזה בניתוחים הבאים."
- Respect responseStyle: תמציתי = short answers, מפורט = comprehensive, חם = friendly tone, לימודי = explain concepts and teach, מקצועי = formal structured.
- If customInstructions is set, follow them as additional guidelines.
```

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add mastra/tools/profile.ts mastra/agents/dirot-agent.ts
git commit -m "feat: add getProfile/updateProfile tools and agent instructions"
```

---

### Task 3: API Route — `PATCH /api/profile`

**Files:**
- Create: `app/api/profile/route.ts`

- [ ] **Step 1: Create the API route**

Create `app/api/profile/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSession } from "@/lib/auth";

const ALLOWED_FIELDS = new Set([
  "investorType",
  "investmentHorizon",
  "riskTolerance",
  "budgetRange",
  "experienceLevel",
  "areasOfInterest",
  "responseStyle",
  "customInstructions",
]);

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT "investorType", "investmentHorizon", "riskTolerance",
           "budgetRange", "experienceLevel", "areasOfInterest",
           "responseStyle", "customInstructions"
    FROM user_preferences
    WHERE "userId" = ${session.user.id}
    LIMIT 1
  `;

  return NextResponse.json({ profile: rows[0] ?? null });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { field, value } = body as { field?: string; value?: string };

  if (!field || !ALLOWED_FIELDS.has(field)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const now = new Date();

  await sql`
    INSERT INTO user_preferences (id, "userId", "${sql(field)}", "createdAt", "updatedAt")
    VALUES (${crypto.randomUUID()}, ${session.user.id}, ${value ?? null}, ${now}, ${now})
    ON CONFLICT ("userId")
    DO UPDATE SET "${sql(field)}" = ${value ?? null}, "updatedAt" = ${now}
  `;

  const rows = await sql`
    SELECT "investorType", "investmentHorizon", "riskTolerance",
           "budgetRange", "experienceLevel", "areasOfInterest",
           "responseStyle", "customInstructions"
    FROM user_preferences
    WHERE "userId" = ${session.user.id}
    LIMIT 1
  `;

  return NextResponse.json({ profile: rows[0] ?? null });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/profile/route.ts
git commit -m "feat: add PATCH /api/profile endpoint for sidebar edits"
```

---

### Task 4: Profile Sidebar Component

**Files:**
- Create: `components/profile/profile-sidebar.tsx`
- Create: `components/profile/profile-field.tsx`
- Create: `components/profile/area-tags.tsx`
- Create: `components/profile/tone-selector.tsx`
- Create: `components/profile/custom-instructions.tsx`
- Create: `hooks/use-profile.ts`

- [ ] **Step 1: Create the useProfile hook**

Create `hooks/use-profile.ts`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";

interface Profile {
  investorType: string | null;
  investmentHorizon: string | null;
  riskTolerance: string | null;
  budgetRange: string | null;
  experienceLevel: string | null;
  areasOfInterest: string | null;
  responseStyle: string | null;
  customInstructions: string | null;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) return;
      const data = await res.json();
      setProfile(data.profile);
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateField = useCallback(
    async ({ field, value }: { field: string; value: string | null }) => {
      setProfile((prev) =>
        prev ? { ...prev, [field]: value } : ({ [field]: value } as Profile),
      );

      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field, value }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProfile(data.profile);
      } catch {
        fetchProfile();
      }
    },
    [fetchProfile],
  );

  return { profile, isLoading, updateField, refetch: fetchProfile };
}
```

- [ ] **Step 2: Create ProfileField component**

Create `components/profile/profile-field.tsx`:

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ProfileFieldProps {
  label: string;
  value: string | null;
  options: string[];
  onSelect: ({ value }: { value: string }) => void;
}

export function ProfileField({ label, value, options, onSelect }: ProfileFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-between" ref={ref}>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="relative">
        {value ? (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full border border-transparent bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary hover:border-primary"
          >
            {value} ✎
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
          >
            + בחר
          </button>
        )}
        {isOpen && (
          <div className="absolute start-0 top-full z-10 mt-1 min-w-[120px] overflow-hidden rounded-lg border border-border bg-background shadow-sm">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onSelect({ value: opt });
                  setIsOpen(false);
                }}
                className={cn(
                  "block w-full px-3 py-1.5 text-start text-xs hover:bg-muted",
                  opt === value && "bg-primary/10 font-medium text-primary",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create AreaTags component**

Create `components/profile/area-tags.tsx`:

```typescript
"use client";

import { useState } from "react";

interface AreaTagsProps {
  areas: string[];
  onUpdate: ({ areas }: { areas: string[] }) => void;
}

export function AreaTags({ areas, onUpdate }: AreaTagsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");

  function handleRemove({ city }: { city: string }) {
    onUpdate({ areas: areas.filter((a) => a !== city) });
  }

  function handleAdd() {
    const trimmed = draft.trim();
    if (trimmed && !areas.includes(trimmed)) {
      onUpdate({ areas: [...areas, trimmed] });
    }
    setDraft("");
    setIsAdding(false);
  }

  return (
    <div>
      <div className="mb-1.5 text-[11px] text-muted-foreground">אזורים</div>
      <div className="flex flex-wrap gap-1">
        {areas.map((city) => (
          <span
            key={city}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
          >
            {city}
            <button
              type="button"
              onClick={() => handleRemove({ city })}
              className="opacity-50 hover:opacity-100"
            >
              ×
            </button>
          </span>
        ))}
        {isAdding ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setIsAdding(false);
            }}
            onBlur={handleAdd}
            placeholder="שם עיר"
            className="w-20 rounded-full border border-primary bg-transparent px-2 py-0.5 text-[11px] outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
          >
            + עיר
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create ToneSelector component**

Create `components/profile/tone-selector.tsx`:

```typescript
"use client";

import { cn } from "@/lib/utils";

const TONES = ["מקצועי", "תמציתי", "מפורט", "חם", "לימודי"] as const;

interface ToneSelectorProps {
  value: string | null;
  onSelect: ({ tone }: { tone: string }) => void;
}

export function ToneSelector({ value, onSelect }: ToneSelectorProps) {
  return (
    <div>
      <div className="mb-2 text-[11px] text-muted-foreground">סגנון תשובות</div>
      <div className="flex flex-wrap gap-1">
        {TONES.map((tone) => (
          <button
            key={tone}
            type="button"
            onClick={() => onSelect({ tone })}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] transition-colors",
              tone === (value ?? "מקצועי")
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:border-primary hover:text-primary",
            )}
          >
            {tone}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create CustomInstructions component**

Create `components/profile/custom-instructions.tsx`:

```typescript
"use client";

import { useState } from "react";

interface CustomInstructionsProps {
  value: string | null;
  onSave: ({ instructions }: { instructions: string }) => void;
}

export function CustomInstructions({ value, onSave }: CustomInstructionsProps) {
  const [draft, setDraft] = useState(value ?? "");
  const isDirty = draft !== (value ?? "");

  return (
    <div>
      <div className="mb-1.5 text-[11px] text-muted-foreground">הוראות מותאמות</div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (isDirty) onSave({ instructions: draft });
        }}
        placeholder="הוראות נוספות לסוכן..."
        className="w-full resize-none rounded-lg border border-border bg-muted/30 px-2.5 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
        rows={3}
      />
    </div>
  );
}
```

- [ ] **Step 6: Create the ProfileSidebar component**

Create `components/profile/profile-sidebar.tsx`:

```typescript
"use client";

import { MessageSquare } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useProfile } from "@/hooks/use-profile";
import { ProfileField } from "@/components/profile/profile-field";
import { AreaTags } from "@/components/profile/area-tags";
import { ToneSelector } from "@/components/profile/tone-selector";
import { CustomInstructions } from "@/components/profile/custom-instructions";

const FIELD_OPTIONS = {
  investorType: ["מגורים", "השקעה", "שניהם"],
  investmentHorizon: ["קצר (1-3)", "בינוני (3-7)", "ארוך (7+)"],
  riskTolerance: ["שמרני", "מאוזן", "אגרסיבי"],
  budgetRange: ["עד 1.5M", "1.5-2.5M", "2.5-4M", "4M+"],
  experienceLevel: ["ראשון", "יש ניסיון", "מנוסה"],
};

const FIELD_LABELS: Record<string, string> = {
  investorType: "סוג",
  investmentHorizon: "אופק",
  riskTolerance: "סיכון",
  budgetRange: "תקציב",
  experienceLevel: "ניסיון",
};

export function ProfileSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { profile, updateField } = useProfile();

  const areas: string[] = profile?.areasOfInterest
    ? JSON.parse(profile.areasOfInterest)
    : [];

  return (
    <Sidebar {...props}>
      <SidebarHeader className="mb-2 border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <MessageSquare className="size-4" />
              </div>
              <div className="me-6 flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">דירות</span>
                <span className="text-xs text-muted-foreground">
                  אנליסט פינוי בינוי
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-4">
        {/* Profile header */}
        <div className="mb-3">
          <div className="text-sm font-semibold text-foreground">פרופיל משקיע</div>
          <div className="text-[11px] text-muted-foreground">לחץ לעריכה</div>
        </div>

        {/* Profile fields */}
        <div className="flex flex-col gap-2.5">
          {Object.entries(FIELD_OPTIONS).map(([field, options]) => (
            <ProfileField
              key={field}
              label={FIELD_LABELS[field]}
              value={profile?.[field as keyof typeof profile] as string | null}
              options={options}
              onSelect={({ value }) => updateField({ field, value })}
            />
          ))}

          <AreaTags
            areas={areas}
            onUpdate={({ areas: newAreas }) =>
              updateField({ field: "areasOfInterest", value: JSON.stringify(newAreas) })
            }
          />
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-border" />

        {/* Tone */}
        <ToneSelector
          value={profile?.responseStyle ?? null}
          onSelect={({ tone }) => updateField({ field: "responseStyle", value: tone })}
        />

        {/* Divider */}
        <div className="my-3 border-t border-border" />

        {/* Custom instructions */}
        <CustomInstructions
          value={profile?.customInstructions ?? null}
          onSave={({ instructions }) =>
            updateField({ field: "customInstructions", value: instructions })
          }
        />

        {/* Footer */}
        <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
          <MessageSquare className="size-3" />
          <span>הצ׳אט גם יעדכן את הפרופיל אוטומטית</span>
        </div>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add hooks/use-profile.ts components/profile/
git commit -m "feat: add profile sidebar UI components"
```

---

### Task 5: Wire Up — Replace ThreadListSidebar with ProfileSidebar

**Files:**
- Modify: `app/assistant.tsx` (lines 11, 53)

- [ ] **Step 1: Replace sidebar import and usage**

In `app/assistant.tsx`:

Replace import (line 11):
```typescript
// Remove:
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
// Add:
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
```

Replace usage (line 53):
```typescript
// Remove:
<ThreadListSidebar side="right" />
// Add:
<ProfileSidebar side="right" />
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Manual test**

1. `pnpm dev` → open http://localhost:7000/app
2. Verify profile sidebar appears on the right
3. Click a chip → dropdown opens with options
4. Select an option → chip updates, API call succeeds
5. Add a city tag → appears in the list
6. Select a tone → active chip changes
7. Type custom instructions → saved on blur

- [ ] **Step 4: Commit**

```bash
git add app/assistant.tsx
git commit -m "feat: replace thread sidebar with investor profile panel"
```

---

### Task 6: Integration Test — Agent Profile Flow

- [ ] **Step 1: Test the full flow locally**

1. Open the app, send: "תן ציון השקעה לבת ים"
2. Verify the agent calls `getProfile` at the start (visible in tool calls or dev console)
3. Verify the agent delivers analysis and asks a follow-up about investment preferences
4. Respond: "אני מחפש השקעה לטווח ארוך"
5. Verify the agent calls `updateProfile` with `field: "investorType", value: "השקעה"` and `field: "investmentHorizon", value: "ארוך"`
6. Verify the sidebar reflects the change
7. Start a new conversation — verify the agent loads the profile and references it

- [ ] **Step 2: Push to production**

```bash
git push
```

---

### Task 7: Update proxy for new API route

**Files:**
- Modify: `proxy.ts` (if needed — check if `/api/profile` needs protection)

- [ ] **Step 1: Verify `/api/profile` is accessible**

The `proxy.ts` only protects `/app`. API routes use session auth internally. No proxy change needed — the `GET /PATCH /api/profile` route already checks `getSession()`.

- [ ] **Step 2: Final build and push**

```bash
pnpm build && git push
```
