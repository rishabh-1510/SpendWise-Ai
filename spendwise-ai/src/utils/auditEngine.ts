import { pricingData, getSelectablePlans, calculateMonthlyCost } from "@/data/pricing";
import type { ToolPlan } from "@/data/pricing";

/* ─────────────────────────────────────── */
/* Types                                   */
/* ─────────────────────────────────────── */

type UseCase = "coding" | "writing" | "research" | "mixed";

/** Matches the Row type from AuditForm */
type ToolRow = {
  tool:  string;
  plan:  string;
  seats: number;
  spend: number | null;
};

export type Recommendation = {
  tool:     string;
  issue:    string;
  action:   string;
  /** Estimated monthly savings in USD */
  savingsMonthly: number;
  priority: "high" | "medium" | "low";
};

export type AuditResult = {
  /** 0–100. Lower = more waste detected. */
  score:           number;
  totalMonthly:    number;
  totalAnnual:     number;
  /** Estimated annual savings if all recommendations are applied */
  savingsAnnual:   number;
  recommendations: Recommendation[];
  useCase:         UseCase;
  teamSize:        number;
};

/* ─────────────────────────────────────── */
/* Helpers                                 */
/* ─────────────────────────────────────── */

/** True if the plan name suggests an enterprise-tier contract */
function isEnterprisePlan(planName: string): boolean {
  return /enterprise/i.test(planName);
}

/** True if the plan name suggests a team/business-tier subscription */
function isTeamPlan(planName: string): boolean {
  return /team|business/i.test(planName);
}

/**
 * Returns the cheapest fixed-price plan for a tool that is strictly
 * cheaper than `currentPlan` and has the same or compatible `perSeat`
 * characteristic (avoids suggesting a per-seat plan to replace a flat one).
 */
function cheaperAlternative(
  plans: ToolPlan[],
  currentPlan: ToolPlan
): ToolPlan | null {
  if (currentPlan.price === null) return null;

  return (
    plans
      .filter(
        (p) =>
          p.price !== null &&
          p.price < currentPlan.price! &&
          p.perSeat === currentPlan.perSeat &&
          p.billing !== "usage" &&
          p.billing !== "custom"
      )
      .sort((a, b) => b.price! - a.price!) // highest cheaper plan first (smallest jump)
      [0] ?? null
  );
}

/**
 * Resolves the effective monthly spend for a row.
 * Falls back to re-computing from pricing data if `row.spend` is null
 * (e.g. usage-based plans that were entered manually).
 */
function resolveSpend(row: ToolRow): number {
  if (row.spend !== null) return row.spend;
  const plan = getSelectablePlans(row.tool).find((p) => p.name === row.plan);
  return plan ? (calculateMonthlyCost(plan, row.seats) ?? 0) : 0;
}

/* ─────────────────────────────────────── */
/* Audit rules                             */
/* ─────────────────────────────────────── */

/**
 * Rule 1 — Enterprise plan with a small team.
 * Enterprise contracts carry significant overhead; teams under 20 seats
 * rarely justify the price.
 */
function ruleEnterpriseTooSmall(
  row: ToolRow,
  spend: number,
  recs: Recommendation[],
  penalties: number[]
) {
  if (!isEnterprisePlan(row.plan)) return;
  if (row.seats >= 20) return;

  const savingsMonthly = Math.round(spend * 0.4);
  recs.push({
    tool:    row.tool,
    issue:   `Enterprise plan with only ${row.seats} seat${row.seats !== 1 ? "s" : ""}`,
    action:  "Downgrade to a Team or Business plan — Enterprise overhead isn't justified below 20 seats.",
    savingsMonthly,
    priority: "high",
  });
  penalties.push(15);
}

/**
 * Rule 2 — Team / Business plan for too few users.
 * Per-seat team plans break even vs. individual plans around 3+ seats.
 */
function ruleTeamPlanUnderused(
  row: ToolRow,
  spend: number,
  recs: Recommendation[],
  penalties: number[]
) {
  if (!isTeamPlan(row.plan)) return;
  if (!row.seats || row.seats > 2) return;

  const savingsMonthly = Math.round(spend * 0.3);
  recs.push({
    tool:    row.tool,
    issue:   `Team/Business plan for only ${row.seats} user${row.seats !== 1 ? "s" : ""}`,
    action:  "Switch to individual plans — they're cheaper for 1–2 users.",
    savingsMonthly,
    priority: "high",
  });
  penalties.push(12);
}

/**
 * Rule 3 — High absolute spend on a single tool.
 * Flags any tool costing over $200/mo as worth reviewing regardless of plan.
 */
function ruleHighSpend(
  row: ToolRow,
  spend: number,
  recs: Recommendation[],
  penalties: number[]
) {
  if (spend <= 200) return;

  const savingsMonthly = Math.round(spend * 0.15);
  recs.push({
    tool:    row.tool,
    issue:   `High monthly spend ($${spend.toLocaleString()})`,
    action:  "Audit active seat usage and consider a lower tier or API direct billing.",
    savingsMonthly,
    priority: "medium",
  });
  penalties.push(8);
}

/**
 * Rule 4 — A cheaper fixed-price plan exists on the same tool.
 * Suggests the closest cheaper plan rather than the absolute cheapest
 * (less jarring recommendation, more likely to be acted on).
 */
function ruleCheaperPlanAvailable(
  row: ToolRow,
  _spend: number,
  currentPlan: ToolPlan,
  allPlans: ToolPlan[],
  recs: Recommendation[],
  penalties: number[]
) {
  const alt = cheaperAlternative(allPlans, currentPlan);
  if (!alt || alt.price === null) return;

  const altSpend= calculateMonthlyCost(alt, row.seats) ?? 0;
  const savingsMonthly = Math.max(0, Math.round(_spend - altSpend));
  if (savingsMonthly === 0) return;

  recs.push({
    tool:    row.tool,
    issue:   `${row.plan} may be over-provisioned`,
    action:  `Downgrade to ${alt.name} ($${alt.price}${alt.perSeat ? "/seat" : ""}/mo) and save ~$${savingsMonthly}/mo.`,
    savingsMonthly,
    priority: "medium",
  });
  penalties.push(6);
}

/**
 * Rule 5 — Overlapping tools in the same category.
 * If a user has two or more tools from the same `category`, flag consolidation.
 * Only fires once per duplicate category pair.
 */
function ruleToolOverlap(
  rows: ToolRow[],
  recs: Recommendation[],
  penalties: number[]
) {
  const categoryMap: Record<string, string[]> = {};

  rows.forEach((row) => {
    if (!row.tool) return;
    const entry = pricingData.find((t) => t.tool === row.tool);
    if (!entry) return;
    const cat = entry.category;
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push(row.tool);
  });

  Object.entries(categoryMap).forEach(([cat, tools]) => {
    if (tools.length < 2) return;
    const categoryLabel =
      cat === "chat-ai"     ? "general chat AI" :
      cat === "coding-ide"  ? "coding IDE" :
                              "API";

    recs.push({
      tool:    tools.join(" + "),
      issue:   `${tools.length} overlapping ${categoryLabel} tools`,
      action:  `Consolidate to one ${categoryLabel} tool. Consider keeping the one that best fits your primary use case.`,
      savingsMonthly: 0, // conservative — savings depend on which tool is dropped
      priority: "high",
    });
    penalties.push(10);
  });
}

/**
 * Rule 6 — Use-case / tool mismatch.
 * Flags if a coding-heavy team is paying for a general chat AI without
 * a coding IDE, or vice versa.
 */
function ruleUseCaseMismatch(
  rows: ToolRow[],
  useCase: UseCase,
  recs: Recommendation[],
  penalties: number[]
) {
  const categories = new Set(
    rows
      .map((r) => pricingData.find((t) => t.tool === r.tool)?.category)
      .filter(Boolean)
  );

  if (
    useCase === "coding" &&
    !categories.has("coding-ide") &&
    categories.has("chat-ai")
  ) {
    recs.push({
      tool:    "Stack",
      issue:   "Coding-focused team with no dedicated coding IDE",
      action:
        "Consider Cursor, Windsurf, or GitHub Copilot — purpose-built coding tools typically outperform general chat AI for code tasks.",
      savingsMonthly: 0,
      priority: "low",
    });
    penalties.push(5);
  }

  if (
    (useCase === "writing" || useCase === "research") &&
    !categories.has("chat-ai") &&
    categories.has("coding-ide")
  ) {
    recs.push({
      tool:    "Stack",
      issue:   `${useCase === "writing" ? "Writing" : "Research"}-focused team using only coding IDEs`,
      action:
        "Claude or ChatGPT (chat-AI plans) will serve writing and research workflows better than coding IDEs.",
      savingsMonthly: 0,
      priority: "low",
    });
    penalties.push(5);
  }
}

/**
 * Rule 7 — Seat count exceeds team size.
 * Catches over-provisioning where seats bought > actual headcount.
 */
function ruleSeatCountExceedsTeam(
  row: ToolRow,
  spend: number,
  teamSize: number,
  currentPlan: ToolPlan,
  recs: Recommendation[],
  penalties: number[]
) {
  if (!currentPlan.perSeat) return;
  if (!teamSize || row.seats <= teamSize) return;

  const excessSeats    = row.seats - teamSize;
  const costPerSeat    = currentPlan.price ?? 0;
  const savingsMonthly = Math.round(excessSeats * costPerSeat);

  recs.push({
    tool:    row.tool,
    issue:   `${row.seats} seats purchased but team has only ${teamSize} members`,
    action:  `Remove ${excessSeats} unused seat${excessSeats !== 1 ? "s" : ""} to save ~$${savingsMonthly}/mo.`,
    savingsMonthly,
    priority: "high",
  });
  penalties.push(12);
}

/* ─────────────────────────────────────── */
/* Main export                             */
/* ─────────────────────────────────────── */

export function runAudit(
  rows:     ToolRow[],
  useCase:  UseCase  = "mixed",
  teamSize: number   = 1
): AuditResult {
  const validRows = rows.filter((r) => r.tool && r.plan);

  const recommendations: Recommendation[] = [];
  const penalties:        number[]         = [];

  // Per-row rules
  validRows.forEach((row) => {
    const tool = pricingData.find((t) => t.tool === row.tool);
    if (!tool) return;

    const allPlans    = getSelectablePlans(row.tool);
    const currentPlan = allPlans.find((p) => p.name === row.plan);
    if (!currentPlan) return;

    const spend = resolveSpend(row);

    ruleEnterpriseTooSmall  (row, spend, recommendations, penalties);
    ruleTeamPlanUnderused   (row, spend, recommendations, penalties);
    ruleHighSpend           (row, spend, recommendations, penalties);
    ruleCheaperPlanAvailable(row, spend, currentPlan, allPlans, recommendations, penalties);
    ruleSeatCountExceedsTeam(row, spend, teamSize, currentPlan, recommendations, penalties);
  });

  // Cross-row rules
  ruleToolOverlap   (validRows, recommendations, penalties);
  ruleUseCaseMismatch(validRows, useCase, recommendations, penalties);

  // Deduplicate: if the same tool+action appears twice (e.g. rule 3 and 4
  // both fire on the same tool), keep only the higher-priority one.
  const seen = new Set<string>();
  const deduped = recommendations.filter((r) => {
    const key = `${r.tool}::${r.issue}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Score: start at 100, subtract penalties, floor at 20
  const score = Math.max(
    20,
    100 - penalties.reduce((sum, p) => sum + p, 0)
  );

  // Totals
  const totalMonthly  = validRows.reduce((sum, r) => sum + resolveSpend(r), 0);
  const totalAnnual   = totalMonthly * 12;
  const savingsAnnual = deduped.reduce(
    (sum, r) => sum + r.savingsMonthly * 12,
    0
  );

  // Sort: high → medium → low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  deduped.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return {
    score,
    totalMonthly:  Math.round(totalMonthly),
    totalAnnual:   Math.round(totalAnnual),
    savingsAnnual: Math.round(savingsAnnual),
    recommendations: deduped,
    useCase,
    teamSize,
  };
}