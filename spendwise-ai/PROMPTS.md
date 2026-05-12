# Prompts

## AI Summary Prompt

Used in `src/services/aiSummary.ts` → `buildPrompt(audit: AuditResult)`.

### Full prompt (as sent to Gemini 2.5 Flash)

```
You are a senior SaaS cost optimisation analyst writing a concise executive summary.

AUDIT DATA
──────────
Optimization score : {score}/100
Monthly spend      : ${totalMonthly}
Annual spend       : ${totalAnnual}
Estimated savings  : ${savingsAnnual}/yr
Team size          : {teamSize} people
Primary use case   : {useCase}
Issues found       : {recommendations.length}

RECOMMENDATIONS
───────────────
  1. [HIGH] {tool} — {issue}
     Action: {action}
     Est. saving: ${savingsMonthly}/mo (${savingsMonthly * 12}/yr)
  2. [MEDIUM] ...
  ...

INSTRUCTIONS
────────────
Write a 4–5 sentence executive summary for a business audience.
- Lead with the total savings opportunity and the score.
- Reference specific tools or issues from the recommendations above (do NOT invent details).
- End with one concrete next step.
- Plain prose only — no bullet points, no markdown, no headers.
- Do not repeat the numbers verbatim more than once.
```

### Generation config

```json
{
  "temperature": 0.4,
  "maxOutputTokens": 300
}
```

### Why this prompt

**Structured sections with real data.** Early iterations passed only `score` and a `savings` number, giving the model nothing to be specific about. The output was generic filler: "your team could save money by optimising AI tools." Adding the full formatted recommendation list (tool, issue, action, exact savings) lets the model reference specific findings, which makes the summary feel personalised rather than templated.

**Temperature 0.4.** Business summaries don't benefit from creativity. Lower temperature keeps output focused and consistent across runs. Above 0.7 the model started inventing tool names and savings figures not in the data.

**`maxOutputTokens: 300`.** Without a ceiling, the model would write 3–4 paragraphs when asked for 4–5 sentences. 300 tokens (≈ 220 words) is a hard ceiling that keeps output tight. The actual target is ~120–180 tokens.

**"do NOT invent details".** Explicit instruction required. In testing without this, the model fabricated a specific tool recommendation ("switch to Windsurf instead of Cursor for your use case") that wasn't in the audit data. Adding the explicit prohibition reduced hallucination on specific claims.

**Plain prose instruction.** Without it, the model returned bullet points roughly 30% of the time, which breaks the card rendering and reads as a second recommendations table rather than a narrative summary.

---

### What I tried that didn't work

**Version 1 — minimal prompt:**
```
Analyze this audit data and write a 4-5 line summary.
Score: {score}. Savings: ${savings}. Recommendations: {recommendations.join('\n')}
```
Problem: `recommendations.join('\n')` on `Recommendation[]` objects produces `[object Object]\n[object Object]`. The model received garbage and produced generic output.

**Version 2 — added formatting but kept temperature at 0.7:**
The output was creative but inconsistent — sometimes referencing tools not in the data, sometimes in bullet form, sometimes in first person ("I recommend..."). 0.7 is appropriate for creative writing, not business analysis.

**Version 3 — added specific tool names but no `maxOutputTokens`:**
The model wrote 400–600 word summaries. Rendering a 600-word paragraph in the report card looked terrible and made the card the dominant element on the page.

---

## Fallback Summary (no API key / timeout / error)

Used in `buildFallback(audit: AuditResult)`:

```
This audit identified ${savingsAnnual} in potential annual savings across your AI tool stack,
with an optimization score of {score}/100. {recommendations.length} issue(s) were detected
covering plan right-sizing, seat optimisation, and tool consolidation. {topRec.action} —
the most impactful action identified. Applying all recommendations would reduce your annual AI
spend from ${totalAnnual} to approximately ${totalAnnual - savingsAnnual}.
```

This is constructed from `AuditResult` fields only — no API call. It reads as a real sentence rather than a JSON dump, and references the top recommendation's `action` string so it's specific to the user's audit even without AI generation.