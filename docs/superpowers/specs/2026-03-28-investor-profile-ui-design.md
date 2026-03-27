# Investor Profile Panel — UI Design

## Context

Users get generic analysis regardless of their goals. We need a profile system where preferences are learned via conversation AND editable directly in a sidebar panel that replaces the unused thread list. The panel also includes a tone/style selector and custom instructions field.

## Design Decision

**Option A: Compact Rows with Clickable Chips** — approved by user after visual comparison.

## Profile Panel Layout

The panel replaces the right sidebar (currently thread list, not working). It has 3 sections separated by dividers:

### Section 1: Investor Profile Fields

Header: "פרופיל משקיע" with subtitle "לחץ לעריכה"

6 fields displayed as label + chip rows:

| Field | Label | Input Type | Options |
|-------|-------|-----------|---------|
| Investor type | סוג | Chip → dropdown | מגורים, השקעה, שניהם |
| Investment horizon | אופק | Chip → dropdown | קצר (1-3), בינוני (3-7), ארוך (7+) |
| Risk tolerance | סיכון | Chip → dropdown | שמרני, מאוזן, אגרסיבי |
| Budget range | תקציב | Chip → dropdown | עד 1.5M, 1.5-2.5M, 2.5-4M, 4M+ |
| Experience | ניסיון | Chip → dropdown | ראשון, יש ניסיון, מנוסה |
| Areas of interest | אזורים | Tag list + "עיר +" | Free text city names, removable × tags |

**Filled fields:** Green chip (`bg-primary/10 text-primary`) with ✎ icon. Click opens a dropdown with options. Hover shows green border.

**Empty fields:** Dashed border chip showing "+ בחר". Click opens the same dropdown.

**Areas field:** Spans full row below the label. Each city is a removable tag with ×. Last item is "+ עיר" dashed chip that opens a city input (free text, since cities are open-ended).

### Section 2: Response Style (סגנון תשובות)

5 toggle chips in a flex-wrap row:
- **מקצועי** (professional) — formal, structured analysis
- **תמציתי** (concise) — short, to the point
- **מפורט** (detailed) — long, comprehensive
- **חם** (warm) — friendly, approachable tone
- **לימודי** (educational) — teaches concepts, explains reasoning

**Behavior:** Single-select (one active at a time). Active chip is solid green (`bg-primary text-white`). Inactive chips have border outline. Default: מקצועי.

### Section 3: Custom Instructions (הוראות מותאמות)

A text area with placeholder "הוראות נוספות לסוכן...". User can type free-form instructions that get appended to the agent's system prompt context. Example: "תמיד תציג השוואה לערים שכנות כשאתה מנתח"

### Footer

Chat bubble SVG icon + text: "הצ׳אט גם יעדכן את הפרופיל אוטומטית"

Communicates that the profile is also updated through natural conversation, not just manual editing.

## Data Flow

### Manual editing (sidebar)
1. User clicks chip → dropdown opens with options
2. User selects → API call to save preference
3. Chip updates immediately (optimistic update)
4. Agent's next response uses updated profile

### Chat-based learning (agent)
1. Agent detects preference from conversation
2. Agent calls `updateProfile` tool
3. Sidebar panel reflects the change (via polling or real-time)
4. Agent confirms: "שמרתי שאתה מחפש השקעה לטווח ארוך"

### Tone & custom instructions
1. Saved to same `user_preferences` table
2. Injected into agent context at conversation start via `getProfile`
3. Agent adjusts response style accordingly

## Technical Implementation

### Database: `user_preferences` table
- All fields from the profile spec (investorType, investmentHorizon, riskTolerance, budgetRange, experienceLevel, areasOfInterest)
- Plus: `responseStyle` (text, default "מקצועי"), `customInstructions` (text, nullable)

### API endpoint: `PATCH /api/profile`
- Accepts partial updates: `{ field: string, value: string }`
- Authenticated (requires session)
- Returns updated profile

### Sidebar component: `components/profile/profile-panel.tsx`
- Client component ("use client")
- Fetches profile on mount, re-fetches on focus
- Each field renders as `ProfileField` subcomponent
- Areas renders as `AreaTags` subcomponent
- Tone renders as `ToneSelector` subcomponent
- Custom instructions renders as `CustomInstructions` textarea

### Agent tools
- `getProfile` — called at conversation start, returns full profile + tone + custom instructions
- `updateProfile` — called when agent learns something from conversation

## Visual Reference

Mockup saved at: `.superpowers/brainstorm/58486-1774646393/content/profile-panel-v3.html`
