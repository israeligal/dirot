# Landing Page — Product Spec

## Problem Statement

Dirot has no landing page. Visitors hit the login screen directly with zero context about what the product does, who it's for, or why they should care. The early access signup form is buried below the login form. This means:

- **No value communication** — potential users don't understand what Dirot is before being asked to log in
- **Low early access conversion** — the signup form is an afterthought on the login page
- **No shareability** — there's nothing compelling to link to when sharing the product

## Goals

1. **Communicate Dirot's value proposition** in under 10 seconds of landing on the page
2. **Drive early access signups** by making the CTA prominent and the demo compelling
3. **Show, don't tell** — demonstrate the product via an auto-typing chat demo rather than just describing it
4. **Establish credibility** — showcase the 20+ data sources and government databases powering the analysis
5. **Feel premium** — light, clean, professional design with polished animations (Stripe/Notion tier)

## Non-Goals

- **No auth on landing page** — this is a public marketing page, not the app. Login/signup links in the nav only.
- **No blog/content section** — separate initiative if needed later.
- **No pricing** — product is in early access, no pricing model yet.
- **No English version** — Hebrew only for now, RTL throughout.
- **No backend changes** — the early access API already exists at `/api/early-access`.

## Target Users

- **Israeli real estate investors** considering Pinui Binui (urban renewal) projects
- **Real estate agents** who want data-backed analysis for their clients
- **Property owners** in buildings marked for PB who want to understand their situation

## User Stories

- As a potential user landing from a shared link, I want to immediately understand what Dirot does so I can decide if it's relevant to me.
- As an interested visitor, I want to see a live demo of the AI analysis so I can judge the product quality before signing up.
- As a visitor convinced by the demo, I want to easily sign up for early access without navigating to a separate page.
- As a mobile visitor, I want the landing page to look and animate well on my phone.

---

## Page Structure

### Section 1: Hero

**Content:**
- Headline: bold, large Hebrew text — the product's one-liner value prop
- Subtitle: 1-2 sentences explaining what Dirot does
- Primary CTA: "קבל גישה מוקדמת" (Get Early Access) button → scrolls to signup section
- Secondary: "ראה איך זה עובד" (See How It Works) → scrolls to chat demo

**Animation:**
- Staggered text reveal on load (headline first, then subtitle, then CTAs)
- Subtle gradient background animation (slow-moving OkLch gradient)

**Design:**
- Full viewport height
- Light background with the teal/turquoise primary color accent
- Clean typography using Rubik font

---

### Section 2: Auto-Typing Chat Demo

**Content:**
- A styled mock of the Dirot chat interface
- Pre-scripted conversation:
  1. User types: "?מה הסטטוס של החשמונאים 22, בת ים"
  2. Agent "thinking" indicator
  3. Agent responds with a structured analysis (project status, units, developer, score)
  4. A comparison card UI element appears mid-response
- Caption below: explaining this is real output from the AI agent

**Animation:**
- Typing animation for user message (character by character, RTL)
- Loading dots for agent thinking
- Agent response streams in line by line
- Data card slides up from bottom with spring physics
- Whole section triggers on scroll into view

**Design:**
- Contained in a browser-frame mockup (rounded corners, subtle shadow)
- Matches the actual app's chat UI styling
- Light card background on a slightly off-white page background

---

### Section 3: Data Sources Grid

**Content:**
- Section title: "20+ מקורות מידע ממשלתיים ושוק" (20+ government & market data sources)
- Grid of icons/badges for each data source category:
  - data.gov.il datasets (PB projects, construction sites, lotteries, contractors, infrastructure, schools, transit)
  - XPLAN Planning Authority
  - Madlan market data
  - Firecrawl web research
- Each badge shows: icon + Hebrew name + brief description

**Animation:**
- Staggered fade-in + slide-up as section scrolls into view
- Each icon appears with a slight delay (50-80ms stagger)
- Subtle float/hover effect on individual badges

**Design:**
- 4-column grid on desktop, 2-column on mobile
- Each badge is a small card with an icon, name, and one-line description
- Muted colors, clean borders

---

### Section 4: How It Works

**Content:**
- 3 steps:
  1. "שאל שאלה" (Ask a Question) — natural language in Hebrew
  2. "הסוכן מנתח 20+ מקורות" (Agent Analyzes 20+ Sources) — parallel data gathering
  3. "קבל דוח מלא" (Get a Full Report) — structured analysis with scoring

**Animation:**
- Steps reveal one by one on scroll
- SVG connecting line draws itself between steps using `pathLength`
- Each step has an icon that scales up with spring physics

**Design:**
- Horizontal flow on desktop, vertical on mobile
- Connected by a drawn line/path
- Step numbers with the primary teal color

---

### Section 5: Animated Stats

**Content:**
- 3-4 stat blocks:
  - "37+" — approved PB projects in Bat Yam (example city)
  - "20+" — government & market data sources
  - "8,500+" — new housing units planned
  - "7" — parallel data queries per address

**Animation:**
- Numbers count up from 0 to target value with spring easing
- Triggers when section scrolls into view (`useInView`)
- Each counter starts with a slight stagger

**Design:**
- Large, bold numbers in primary color
- Small descriptor text below each number
- Horizontal row on desktop, 2x2 grid on mobile

---

### Section 6: Feature Cards

**Content:**
- 3 cards highlighting key capabilities:
  1. **ניתוח פרויקט** (Project Analysis) — full PB project scoring and risk assessment
  2. **מחקר יזם** (Developer Research) — contractor registry + web reputation + safety record
  3. **השוואת נכסים** (Property Comparison) — side-by-side analysis of 2-4 addresses

**Animation:**
- Cards have 3D perspective tilt on hover (`whileHover` with rotateX/Y)
- Glass-morphism effect (backdrop blur, semi-transparent background)
- Staggered entry animation on scroll

**Design:**
- 3-column grid on desktop, single column on mobile
- Subtle border, glass effect, small icon in the corner
- Light shadows that deepen on hover

---

### Section 7: CTA / Early Access

**Content:**
- Headline: "מעוניינים לנסות?" (Want to try it?)
- Subtitle: "השאירו פרטים ונעדכן אתכם כשהפלטפורמה תהיה פתוחה"
- Form: name + email fields + submit button
- Success state: checkmark animation + confirmation message
- Reuses the existing `EarlyAccessForm` component (or a styled variant)

**Animation:**
- Subtle pulse/glow on the submit button
- Success checkmark draws itself with SVG animation
- Confetti or sparkle effect on successful signup (subtle, not over the top)

**Design:**
- Centered, generous whitespace
- Primary color CTA button, large and obvious

---

### Navigation

- Sticky top nav with: Logo/name, section links (smooth scroll), "התחבר" (Login) button
- Transparent on hero, becomes solid white with shadow on scroll
- Mobile: hamburger menu

---

## Technical Requirements

### Must-Have (P0)

- [ ] All 7 sections render correctly on mobile (375px+) and desktop
- [ ] Auto-typing chat demo plays when scrolled into view
- [ ] Stats counters animate on scroll
- [ ] Early access form submits to existing `/api/early-access` endpoint
- [ ] Page is a new route (`/landing` or root `/` for unauthenticated users)
- [ ] RTL layout throughout (Hebrew)
- [ ] Performance: no animation jank, 60fps on mid-range devices
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1

### Nice-to-Have (P1)

- [ ] 3D tilt on feature cards
- [ ] SVG path draw animation on "How It Works"
- [ ] Gradient background animation on hero
- [ ] Sticky nav with scroll-aware transparency
- [ ] Confetti on successful signup

### Future (P2)

- [ ] A/B test different hero copy
- [ ] Video demo option instead of/alongside auto-typing
- [ ] English version
- [ ] Social proof section (testimonials, if available)

## Technical Approach

- **Route**: New page at `app/(marketing)/page.tsx` or conditional render in `app/page.tsx` based on auth state
- **Animation library**: `motion` (v12, already installed) — `useInView`, `useScroll`, `useSpring`, `motion.div`, `AnimatePresence`
- **CSS**: Tailwind v4 + `tw-animate-css` for simple transitions
- **Components**: Server component for the page shell, client components for animated sections
- **Early access form**: Reuse or adapt existing `components/auth/early-access-form.tsx`
- **Motion MCP**: Install `motion-dev-mcp` for better animation code generation

## Routing Strategy

**Option A (Recommended):** Unauthenticated visitors see the landing page at `/`, authenticated users see the chat app at `/`. Use `proxy.ts` or middleware to route based on session.

**Option B:** Landing page at `/landing`, keep `/` as the app. Nav links go to `/login`.

## Success Metrics

- **Early access signups** — target: 2x current rate within 30 days
- **Time on page** — target: > 45 seconds average (indicates engagement with animations/demo)
- **Scroll depth** — target: > 60% reach the CTA section
- **Bounce rate** — target: < 50% (currently N/A since there's no landing page)

## Open Questions

- **[Design]** Do we want a custom illustration/graphic for the hero, or is the chat demo enough?
- **[Content]** What's the best Hebrew headline? Need copywriting input.
- **[Engineering]** Should the auto-typing demo use real (cached) data or hardcoded mock data?
- **[Product]** Should the login button in nav go to `/login` or show an inline auth modal?

## Dependencies

- Existing `/api/early-access` endpoint (already working)
- `motion` v12 (already installed)
- `motion-dev-mcp` (to install for dev workflow)
- PostHog tracking (already set up — add `landing_page_viewed`, `cta_clicked`, `demo_scrolled_into_view` events)
