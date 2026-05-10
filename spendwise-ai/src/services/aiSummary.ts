import type { AuditResult, Recommendation } from "@/utils/auditEngine";

/* ─────────────────────────────────────── */
/* Config                                  */
/* ─────────────────────────────────────── */

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

/**
 * ⚠️  The API key is embedded in a client-side request and is visible in
 * browser DevTools. For production, proxy this call through your own backend
 * so the key never leaves the server.
 */

/* ─────────────────────────────────────── */
/* Prompt builder                          */
/* ─────────────────────────────────────── */

function formatRecommendations(recs: Recommendation[]): string {
  if (recs.length === 0) return "  None — stack appears well optimised.";
  return recs
    .map(
      (r, i) =>
        `  ${i + 1}. [${r.priority.toUpperCase()}] ${r.tool} — ${r.issue}\n` +
        `     Action: ${r.action}\n` +
        (r.savingsMonthly > 0
          ? `     Est. saving: $${r.savingsMonthly}/mo ($${r.savingsMonthly * 12}/yr)`
          : "     Est. saving: varies")
    )
    .join("\n");
}

function buildPrompt(audit: AuditResult): string {
  return `
You are a senior SaaS cost optimisation analyst writing a concise executive summary.

AUDIT DATA
──────────
Optimization score : ${audit.score}/100
Monthly spend      : $${audit.totalMonthly.toLocaleString()}
Annual spend       : $${audit.totalAnnual.toLocaleString()}
Estimated savings  : $${audit.savingsAnnual.toLocaleString()}/yr
Team size          : ${audit.teamSize} people
Primary use case   : ${audit.useCase}
Issues found       : ${audit.recommendations.length}

RECOMMENDATIONS
───────────────
${formatRecommendations(audit.recommendations)}

INSTRUCTIONS
────────────
Write a 4–5 sentence executive summary for a business audience.
- Lead with the total savings opportunity and the score.
- Reference specific tools or issues from the recommendations above (do NOT invent details).
- End with one concrete next step.
- Plain prose only — no bullet points, no markdown, no headers.
- Do not repeat the numbers verbatim more than once.
`.trim();
}

/* ─────────────────────────────────────── */
/* Fallback (used when API is unavailable) */
/* ─────────────────────────────────────── */

function buildFallback(audit: AuditResult): string {
  const topRec = audit.recommendations[0];
  const topLine = topRec
    ? `The most impactful action is to ${topRec.action.toLowerCase()}`
    : "Reviewing plan tiers and seat counts is the recommended first step.";

  return (
    `This audit identified $${audit.savingsAnnual.toLocaleString()} in potential annual savings ` +
    `across your AI tool stack, with an optimization score of ${audit.score}/100. ` +
    `${audit.recommendations.length} issue${audit.recommendations.length !== 1 ? "s were" : " was"} ` +
    `detected covering plan right-sizing, seat optimisation, and tool consolidation. ` +
    `${topLine}. ` +
    `Applying all recommendations would reduce your annual AI spend from ` +
    `$${audit.totalAnnual.toLocaleString()} to approximately ` +
    `$${Math.max(0, audit.totalAnnual - audit.savingsAnnual).toLocaleString()}.`
  );
}

/* ─────────────────────────────────────── */
/* Main export                             */
/* ─────────────────────────────────────── */

export async function generateAISummary(audit: AuditResult): Promise<string> {
  // Graceful degradation when the key isn't configured
  if (!API_KEY) {
    console.warn("[aiSummary] VITE_GEMINI_API_KEY is not set — using fallback summary.");
    return buildFallback(audit);
  }

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 15_000); // 15 s

  try {
    const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
      method:  "POST",
      signal:  controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role:  "user",
            parts: [{ text: buildPrompt(audit) }],
          },
        ],
        generationConfig: {
          temperature:     0.4,  // focused, not creative
          maxOutputTokens: 300,  // 4–5 sentences is ~120–180 tokens; 300 is a safe ceiling
          stopSequences:   [],
        },
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      // Surface the error body in dev without leaking it in prod
      if (import.meta.env.DEV) {
        const body = await response.text();
        console.error("[aiSummary] Gemini API error:", response.status, body);
      }
      return buildFallback(audit);
    }

    const json = await response.json();
    const text: string | undefined =
      json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text?.trim()) return buildFallback(audit);

    return text.trim();
  } catch (err) {
    clearTimeout(timeout);

    if (err instanceof Error && err.name === "AbortError") {
      console.warn("[aiSummary] Gemini request timed out — using fallback.");
    } else if (import.meta.env.DEV) {
      console.error("[aiSummary] Unexpected error:", err);
    }

    return buildFallback(audit);
  }
}