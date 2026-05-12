# Reflection

## 1. The hardest bug I hit this week

The hardest bug was the audit engine's Rule 1 silently never firing. The rule was supposed to flag enterprise plans used by small teams, but every test case I ran showed no recommendation even when it should have triggered. I had three hypotheses: (1) the rule condition was logically inverted, (2) the `pricingData` lookup was failing silently, or (3) the plan name wasn't matching.

I added `console.log` at the start of each rule function to confirm they were being called — they were. I then logged `row.plan` inside Rule 1 and compared it to the string being checked. The log showed `row.plan = "Enterprise"` and the condition was `row.plan === "Enterprice"` — a typo with a transposed letter. It had been there since the original engine and had never been caught because TypeScript doesn't type-check string literal comparisons against arbitrary values.

The fix was replacing the brittle string equality check with a regex: `/enterprise/i.test(planName)`. This also future-proofed the rule against vendors that capitalise differently ("ENTERPRISE", "enterprise"). The lesson was that string matching against user-facing labels is fragile — any change in `pricing.ts` plan names would silently break rules. I refactored all plan-name-matching rules to use regex helpers (`isEnterprisePlan`, `isTeamPlan`) for the same reason.

---

## 2. A decision I reversed mid-week

I initially built `AuditForm` using `react-hook-form` + Zod validation, reasoning that form validation is exactly what RHF is for. By Day 2 I had the form working visually but realised the schema validation was never actually running — the audit was triggered by a button `onClick` that called `runAudit()` directly, bypassing `handleSubmit` entirely. The Zod schema and the runtime `Row` state were two separate things that had diverged.

I reversed this on Day 3. The core issue was that `react-hook-form` is designed for static forms with a fixed set of fields. My form is a dynamic list of rows where each row has a tool, plan, seats, and computed spend — the number of rows changes at runtime. Forcing RHF to manage this required either field arrays (complex) or a hybrid where RHF tracks some state and plain `useState` tracks the rows (confusing). Neither was worth it.

Plain `useState` with explicit `updateRow`, `addRow`, `removeRow` helpers is 40 lines and completely legible. The trade-off is no built-in validation, but the "validation" for this form is simply "at least one row has a tool and plan selected" — a one-line check before calling `handleGenerate`. Removing RHF also removed ~30 lines of dead imports and schema code.

---

## 3. What I would build in week 2

The most valuable week-2 addition would be **lead capture with email-triggered follow-up** — the current build shows savings but doesn't capture them. A modal after audit generation asking for email + company name, stored in Supabase, with a Resend transactional email containing the full audit summary PDF would close the loop between "user saw value" and "Credex has a warm lead."

Second priority: **benchmark mode** — "your AI spend per developer is $X; teams your size (10–50 people, coding use case) average $Y." This requires aggregating anonymised audit data across submissions. Even with 50 audits, you can show a credible benchmark. This is the feature most likely to get the tool shared — people share comparisons, not just personal results.

Third: **embeddable widget** — a `<script>` tag that renders a minimal "What's your AI tool bill?" form on any blog or newsletter. The indie hacker and startup media ecosystem is full of authors who would drop this in for free if the widget is polished and the value prop is clear in the embed itself. This is the viral distribution mechanism the tool is missing.

---

## 4. How I used AI tools

I used Claude (Sonnet 4.6) as my primary tool throughout the week, primarily for code review, catching bugs, and reasoning through architecture decisions. Specific uses:

- **Pricing data verification**: Asked Claude to cross-check my `pricing.ts` values against its knowledge, then independently verified each number against official vendor pages. Claude correctly flagged that Gemini's plan names had changed (the product was previously called "Google One AI Premium") and that GitHub Copilot was switching to usage-based billing in June 2026.
- **Audit engine rules**: I wrote the rules myself first, then asked Claude to review them for logical correctness and edge cases. It caught that my `cheaperAlternative()` function was returning `plans[0]` on an unsorted array, which could return the absolute cheapest plan rather than the closest step down.
- **TypeScript types**: Used Claude to think through the `ToolPlan` type design — specifically the `price: null` ambiguity (was it custom pricing or usage-based?). Claude suggested splitting into `BillingType` with four values, which resolved the ambiguity cleanly.

**What I didn't trust AI with:** The actual audit reasoning. I wrote every rule myself and verified that a finance-literate person would agree with each one. AI suggestions for rules tended to be either too aggressive ("flag any tool over $50/month") or too vague ("check if the plan matches usage"). The defensible rules required knowing the actual price breaks and seat minimums for each tool — that's research, not generation.

**One specific time AI was wrong:** Claude suggested adding `"API Direct"` as a selectable plan in the dropdown for ChatGPT and Claude. This sounds correct but is actually wrong — usage-based API plans have no fixed monthly cost, so selecting them produces `$0` monthly spend, which makes the savings calculation meaningless. I caught this and instead excluded all `billing: "usage"` plans from `getSelectablePlans()`, using `billing` as the filter rather than trying to detect API plans by name.

---

## 5. Self-ratings

**Discipline: 7/10**
I committed across all 7 days and didn't leave documentation to the last day, but I underestimated the time required for user interviews and had to schedule the third one late in the week.

**Code quality: 8/10**
The codebase is well-typed, the abstractions are clean (each file has one job), and the bugs I introduced (typo in rule matching, wrong field names, module-level localStorage reads) were real mistakes I caught and fixed rather than shortcuts I left in.

**Design sense: 7/10**
The glassmorphism dark dashboard aesthetic is appropriate for the product and executed consistently. The `AISummaryCard` animated border is the strongest individual design moment. I underinvested in mobile responsiveness and the form layout on narrow screens needs work.

**Problem-solving: 8/10**
The share-URL architecture (base64 in query param, no backend) is the decision I'm most proud of — it's the right tool for the job, it's simple, and it solves the problem completely. The audit engine rule decomposition (pure functions, penalty array, dedup pass) is solid.

**Entrepreneurial thinking: 6/10**
I understand the user and the economics, and I wrote GTM.md with specific channels. What I underdelivered on is the lead capture backend — without email capture, the tool has no lead-gen loop, which is the entire business case for Credex. That's a week-2 priority and should have been week-1.