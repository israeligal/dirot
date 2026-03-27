# Terms of Service & Privacy Policy — PRD

## Problem Statement

Dirot collects user data (accounts, conversations, analytics, property searches) and provides AI-generated investment analysis. Without proper legal documents, the company is exposed to liability from users treating AI output as professional investment advice, and non-compliant with Israeli privacy law (Privacy Protection Law 1981). Competitors (Madlan, OpenAI, Perplexity) all have comprehensive legal frameworks. Dirot needs Terms of Service and a Privacy Policy before any public launch.

## Goals

1. **Legal protection** — Shield the company from liability when AI output is inaccurate or users make investment decisions based on it
2. **Privacy compliance** — Comply with Israel's Privacy Protection Law 1981 and Communications Law Amendment 40
3. **User trust** — Be transparent about what data is collected, how it's used, and what the AI's limitations are
4. **Conversation data clarity** — Users understand their chat history is stored and may be reviewed anonymously for quality

## Non-Goals

- **GDPR compliance** — Israel-only audience for now; revisit if international users are added
- **Cookie consent banner** — Not required under Israeli law (unlike EU); can add later
- **Database registration** — May be required under Israeli law; flagged as open question for a lawyer
- **Lawyer review** — This spec produces a first draft; professional legal review is needed before launch

---

## What Dirot Collects (Data Inventory)

### Directly Provided by User
| Data | Where | Purpose |
|------|-------|---------|
| Name, email, password | Signup/login | Authentication |
| Name, email | Early access form | Waitlist |
| Chat messages | Chat UI | AI analysis |
| Saved property notes | Save feature | Portfolio tracking |

### Automatically Collected
| Data | Where | Purpose |
|------|-------|---------|
| IP address | Rate limiting, sessions | Security, abuse prevention |
| User agent | Sessions | Device compatibility |
| PostHog events | All pages | Product analytics (EU-hosted) |
| Madlan API logs | Property searches | Data lake for research |

### Third-Party Services
| Service | Data Shared | Purpose |
|---------|-------------|---------|
| Google Gemini AI | Conversation content | LLM inference |
| PostHog (EU) | User events, email | Product analytics |
| Neon PostgreSQL | All stored data | Database hosting |
| Resend | Email address, name | Transactional email |
| Upstash Redis | Request identifiers | Rate limiting |
| Madlan API | Address/neighborhood queries | Real estate data |

### Retention
| Data | Retention |
|------|-----------|
| Sessions | 7 days |
| Chat history | Indefinite (user can request deletion) |
| Saved properties | Until user deletes |
| Madlan API logs | Indefinite (anonymized data lake) |
| PostHog events | Per PostHog retention (90 days default) |

---

## Terms of Service — Required Sections

### 1. Service Description
- Dirot is an AI-powered analysis tool for Israeli Pinui Binui (urban renewal) investment research
- Uses government open data (data.gov.il), planning authority data (XPLAN), and market data (Madlan)
- Provides automated scoring, analysis, and research assistance

### 2. AI Disclaimer (Critical)
Following OpenAI/Perplexity pattern, must include:

- **AI output may be inaccurate, incomplete, or contain errors.** Due to the probabilistic nature of AI, analysis may not accurately reflect real conditions.
- **Not a substitute for professional advice.** Output does not replace real estate appraisers (שמאי מקרקעין), lawyers, financial advisors, accountants, or any licensed professional.
- **User must independently verify all information.** Cross-reference with official sources, consult professionals before any decision.
- **Not an appraisal (שומת מקרקעין).** The scoring system and analysis do not constitute a certified property appraisal under Israeli law.
- **No recommendation to buy or sell.** Analysis is informational only. Dirot does not recommend, endorse, or advise on any specific transaction.
- **Forward-looking estimates may not materialize.** Projections about project timelines, price trends, and urban development are estimates based on available data.
- **Data may be outdated or incomplete.** Government datasets are synced periodically and may not reflect the latest changes.

### 3. User Responsibilities
- User is solely responsible for decisions made based on the service
- User must be 18+ and an Israeli resident (or authorized to access Israeli market data)
- User must not use the service for unlawful purposes
- User must not share account credentials

### 4. Intellectual Property
- Service content, design, and analysis methodology belong to Dirot
- User retains ownership of their input (questions, saved notes)
- User grants Dirot a license to process their input for service delivery and quality improvement (anonymized)

### 5. Limitation of Liability
Following Madlan pattern:
- Service provided "AS IS" (כמות שהוא) without warranty
- No liability for direct or indirect damages from reliance on analysis
- No liability for data accuracy, completeness, or timeliness
- Maximum liability limited to fees paid (if any) in the 12 months prior

### 6. Account Termination
- Dirot may terminate or suspend accounts for violations
- User may request account deletion and data export
- Upon deletion: account data removed, conversation history deleted, saved properties removed
- Anonymized/aggregated data may be retained

### 7. Modifications
- Dirot may update terms with notice via email or in-app notification
- Continued use after notice constitutes acceptance

### 8. Governing Law
- Israeli law governs
- Exclusive jurisdiction: Tel Aviv courts
- Hebrew version is the binding legal version

---

## Privacy Policy — Required Sections

### 1. Data Controller
- [Company name — TBD, not yet incorporated]
- Contact: [TBD email]

### 2. What We Collect
(See data inventory table above — include in full)

### 3. How We Use Your Data
- **Service delivery**: Process your queries, generate analysis, maintain conversation history
- **Quality improvement**: Anonymously review conversations to improve AI accuracy and service quality
- **Security**: Rate limiting, fraud prevention, abuse detection
- **Analytics**: Understand usage patterns to improve the product (via PostHog)
- **Communication**: Send early access notifications, service updates (with consent per Amendment 40)

### 4. Conversation Data
- Chat messages are stored in our database to maintain conversation history across sessions
- Conversations are sent to Google's Gemini AI for processing (Google's terms apply to their handling)
- We may review conversations **anonymously** (stripped of personal identifiers) to improve service quality
- Conversations are **not sold** to third parties
- Conversations are **not used to train AI models** (we use Google's API, not our own model)

### 5. Your Rights (Per Privacy Protection Law 1981)
- Right to access your personal data
- Right to correct inaccurate data
- Right to request data deletion
- Right to withdraw consent for marketing communications
- Contact: [TBD email] or in-app account settings

### 6. Data Security
- Data stored in encrypted databases (Neon PostgreSQL)
- Authentication via Better Auth with hashed passwords
- HTTPS encryption for all data in transit
- Session tokens with 7-day expiry

### 7. Cookies & Tracking
- **PostHog analytics**: Tracks usage events (pages viewed, features used). EU-hosted.
- **Session cookies**: HTTP-only cookies for authentication
- Users can disable cookies via browser settings (may impact functionality)

### 8. Data Sharing
- We share data only with service providers listed in the third-party table above
- We do not sell personal data
- We may disclose data if required by Israeli law or court order

### 9. Children
- Service not intended for users under 18

### 10. Changes to Policy
- Updates posted on the privacy policy page with effective date
- Material changes notified via email

---

## User Stories

### As a visitor (pre-signup)
- I want to read the Terms of Service before signing up so I understand my rights and obligations
- I want to read the Privacy Policy so I know what data will be collected

### As a registered user
- I want to know that AI analysis is not professional advice so I don't over-rely on it
- I want to request deletion of my data so I can exercise my privacy rights
- I want to know who has access to my conversations so I can decide what to share

### As the company
- I want legal protection from users who make bad investments based on AI output
- I want compliance with Israeli privacy law to avoid regulatory issues

---

## Requirements

### Must-Have (P0)
- [ ] Terms of Service page (Hebrew) at `/terms`
- [ ] Privacy Policy page (Hebrew) at `/privacy`
- [ ] Footer links to both pages on landing page and login page
- [ ] AI disclaimer clearly visible — not buried in legalese
- [ ] Investment advice disclaimer following Madlan's per-tool pattern
- [ ] Data collection disclosure matching actual data inventory
- [ ] Conversation data usage explanation (stored, anonymously reviewed, sent to Google AI)
- [ ] User rights section per Privacy Protection Law 1981
- [ ] "AS IS" / no warranty / limitation of liability
- [ ] Israeli law / Tel Aviv courts jurisdiction

### Nice-to-Have (P1)
- [ ] Checkbox consent at signup ("I agree to Terms and Privacy Policy")
- [ ] Data deletion request form or in-app button
- [ ] Cookie/tracking opt-out mechanism
- [ ] Inline AI disclaimer in chat UI (small banner: "ניתוח AI — אינו מהווה ייעוץ מקצועי")

### Future (P2)
- [ ] English translation of legal pages
- [ ] GDPR compliance for EU investors
- [ ] Data export feature (download your conversations and saved properties)
- [ ] Cookie consent banner

---

## Success Metrics

- **Legal coverage**: All 7 AI disclaimer points from Section 2 above are present
- **Data accuracy**: Privacy policy matches actual data collection (verified against codebase audit)
- **Accessibility**: Legal pages load in < 2s, readable on mobile
- **Compliance**: No issues flagged in professional legal review (P1)

## Open Questions

| Question | Owner |
|----------|-------|
| Is database registration required under Privacy Protection Law 1981 for our data types? | Legal |
| Do we need explicit consent checkboxes at signup, or is "by using you agree" sufficient under Israeli law? | Legal |
| Should we add an in-chat disclaimer banner, or is the Terms page sufficient? | Product |
| What is the right retention period for Madlan API logs? Can we anonymize after X months? | Engineering + Legal |
| When the company is incorporated, what entity name and contact details? | Founder |

## Timeline

- **Phase 1 (now)**: Write Hebrew Terms + Privacy Policy pages, add to the app
- **Phase 2 (pre-launch)**: Professional legal review, incorporate feedback
- **Phase 3 (post-launch)**: Add consent checkbox, deletion flow, cookie controls

---

## Competitor Research Sources

- Madlan (madlan.co.il/etc/terms) — Israeli RE platform, per-tool disclaimers
- OpenAI (openai.com/policies/) — AI accuracy disclaimer standard
- Perplexity (perplexity.ai/hub/legal/) — Investment/financial advice carve-out
- Atvisor (atvisor.ai/he/terms) — Israeli AI platform, informational purposes only
- Realovate (realovate.io/terms) — Israeli proptech, Privacy Protection Law 1981 compliance
- Crystal IP (crystalip.com) — RE investment AI disclaimer page

Full research saved in `.firecrawl/legal-research-summary.md`
