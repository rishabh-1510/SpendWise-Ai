# Architecture

## System Diagram

```mermaid
flowchart TD
    A[User lands on Home] --> B[AuditForm — /audit]
    B --> C{pricing.ts\ngetSelectablePlans}
    C --> D[Row: tool + plan + seats → spend]
    D --> E[localStorage audit-form-v2]
    E --> F[runAudit\nauditEngine.ts]
    F --> G[AuditResult\nscore · savings · recommendations]
    G --> H[generateAISummary\naiSummary.ts]
    H -->|Gemini 2.5 Flash API| I[AI summary paragraph]
    H -->|API failure / timeout| J[Fallback templated summary]
    I --> K[localStorage audit-results]
    J --> K
    K --> L[Results page — /results\nReportContent shared=false]
    L -->|Click Share| M[buildShareUrl\nbase64 encode → ?data= param]
    M --> N[Clipboard → recipient opens link]
    N --> O[/report?data=...\nReportContent shared=true]
    O -->|decodeFromUrl| P[Decoded AuditResult\nno localStorage read]
```

---

## Data Flow

1. **Input** — `AuditForm` reads `pricingData` to populate tool/plan dropdowns. `getSelectablePlans()` filters out `billing: "usage"` and `billing: "custom"` entries so only fixed-price plans appear. When a plan is selected, `calculateMonthlyCost(plan, seats)` computes spend, respecting `perSeat: boolean` so flat plans (ChatGPT Plus) are never multiplied by seat count.

2. **Persistence** — All form state (`rows`, `useCase`, `teamSize`) is written to `localStorage["audit-form-v2"]` on every change via `useEffect`. On mount, `useState` lazy initializers call `loadState()` once — not on every render.

3. **Audit engine** — `runAudit(rows, useCase, teamSize)` runs seven deterministic rules against the rows. Each rule appends `Recommendation` objects (structured: `tool`, `issue`, `action`, `priority`, `savingsMonthly`) and a penalty score. Rules are pure functions — testable in isolation. Output: `AuditResult` with `score`, `totalMonthly`, `totalAnnual`, `savingsAnnual`, `recommendations[]`.

4. **AI summary** — `generateAISummary(audit)` builds a structured prompt from the typed `AuditResult`, calls Gemini 2.5 Flash with `temperature: 0.4` and `maxOutputTokens: 300`, wraps the request in a 15-second `AbortController` timeout. On failure or timeout, `buildFallback(audit)` returns a deterministic templated paragraph using real audit figures.

5. **Report** — `ReportContent` reads `localStorage["audit-results"]` for the owner view, or decodes `?data=` from the URL for the shared view. Charts are built from `comparisonData` (two-bar current vs optimised) and `pieData` (per-tool monthly spend). `AISummaryCard` renders the summary with an animated gradient border and paragraph-aware rendering (`summary.split(/\n+/)`).

6. **Sharing** — `buildShareUrl` serialises `StoredResult` → `JSON.stringify` → `btoa` → `encodeURIComponent` → appended as `?data=`. Recipients open `/report?data=...`, `decodeFromUrl` reverses the encoding, `ReportContent shared={true}` renders the full report without any localStorage dependency.

---

## Stack Choice

| Layer | Choice | Reason |
|---|---|---|
| Framework | React + Vite | Pure client-side tool, no SSR needed, faster HMR than CRA/Next |
| Language | TypeScript | Type safety catches field-name mismatches at compile time (e.g. `savings` vs `savingsAnnual`) |
| Routing | React Router v6 | Simple, well-understood, sufficient for 4 routes |
| Styling | Tailwind CSS v4 + custom CSS vars | Utility-first + design tokens for glassmorphism theme |
| Components | shadcn/ui | Accessible, unstyled primitives — no theme lock-in |
| Charts | Recharts | Lightest React charting library for bar + pie use case |
| AI | Gemini 2.5 Flash | Fast, generous free tier, sufficient for 100-word summaries |
| PDF export | jsPDF + dom-to-image-more | Client-side, no server dependency |
| State/storage | localStorage | No auth, no backend, no cold starts for a stateless audit tool |

---

## What Would Change at 10k Audits/Day

1. **Share URLs would move to server-generated UUIDs** — At scale, 2 KB URLs in analytics logs, email clients that truncate long URLs, and OG crawlers that struggle with query-string-heavy URLs would all cause problems. A `/report/:id` endpoint backed by a KV store (Cloudflare D1 or Redis) with 30-day TTL is the right call above ~1k shares/day.

2. **AI summary would move server-side** — Client-side API calls expose the key in DevTools. A `/api/summary` edge function (Vercel Edge or Cloudflare Worker) proxies the Gemini call, adds rate limiting per IP, and caches identical audit hashes so the same input never calls the API twice.

3. **Audit engine would get a test suite with property-based tests** — At volume, edge cases compound. `fast-check` generating arbitrary `ToolRow[]` inputs against the engine would surface off-by-one errors in savings calculations.

4. **Pricing data would become a database table with a cron job** — Currently a TypeScript file hand-updated. At 10k audits/day, stale pricing causes trust damage. A nightly scraper against vendor pricing pages with a diff alert is the minimum viable automation.

5. **Lead capture (currently absent) would be the primary KPI** — The current build has no email capture backend. At scale this is the entire business case. Supabase + Resend with a simple `/api/capture` edge function is a half-day addition.