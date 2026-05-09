// ============================================================
// pricing.ts — SpendWise AI
// Last verified: May 2026
// Sources: official pricing pages for each tool
// ============================================================

// --------------- Core Types --------------------------------

export type BillingType = "monthly" | "annual" | "usage" | "custom";
export type ToolCategory = "chat-ai" | "coding-ide" | "api";

/**
 * `price` semantics:
 *   number  → fixed monthly cost in USD
 *   null    → see `billing`:
 *               "usage"  → pay-per-token / pay-per-credit (no fixed fee)
 *               "custom" → contact sales; no public price
 */
export type ToolPlan = {
  name: string;
  price: number | null;
  billing: BillingType;
  /**
   * Whether the price is per-seat (multiply by team size)
   * vs. a flat account-level subscription.
   */
  perSeat: boolean;
  /** Optional context: minimums, billing cadence caveats, etc. */
  notes?: string;
};

export type ToolPricing = {
  tool: string;
  category: ToolCategory;
  plans: ToolPlan[];
  /** ISO date string — when this entry was last confirmed against the source */
  lastVerified: string;
};

// --------------- Data ----------------------------------------

export const pricingData: ToolPricing[] = [
  // ── Chat / General AI ──────────────────────────────────────

  {
    tool: "ChatGPT",
    category: "chat-ai",
    lastVerified: "2026-05-10",
    plans: [
      {
        name: "Free",
        price: 0,
        billing: "monthly",
        perSeat: false,
      },
      {
        name: "Go",
        price: 8,
        billing: "monthly",
        perSeat: false,
        notes: "Ad-supported. Available globally.",
      },
      {
        name: "Plus",
        price: 20,
        billing: "monthly",
        perSeat: false,
      },
      {
        name: "Pro",
        price: 100,
        billing: "monthly",
        perSeat: false,
        notes: "5x Plus usage limits. Launched April 2026.",
      },
      {
        name: "Pro Max",
        price: 200,
        billing: "monthly",
        perSeat: false,
        notes: "20x Plus usage limits.",
      },
      {
        name: "Business",
        price: 25,
        billing: "monthly",
        perSeat: true,
        notes: "Min 2 users. $20/seat if billed annually.",
      },
      {
        name: "Enterprise",
        price: null,
        billing: "custom",
        perSeat: true,
        notes: "Contact sales.",
      },
      {
        name: "API",
        price: null,
        billing: "usage",
        perSeat: false,
        notes: "GPT-5.5: $5/M input, $30/M output tokens.",
      },
    ],
  },

  {
    tool: "Claude",
    category: "chat-ai",
    lastVerified: "2026-05-10",
    plans: [
      {
        name: "Free",
        price: 0,
        billing: "monthly",
        perSeat: false,
      },
      {
        name: "Pro",
        price: 20,
        billing: "monthly",
        perSeat: false,
        notes: "$17/mo billed annually.",
      },
      {
        name: "Max 5x",
        price: 100,
        billing: "monthly",
        perSeat: false,
        notes: "5x Pro usage. Includes Claude Code.",
      },
      {
        name: "Max 20x",
        price: 200,
        billing: "monthly",
        perSeat: false,
        notes: "20x Pro usage. Includes Claude Code.",
      },
      {
        name: "Team Standard",
        price: 25,
        billing: "annual",
        perSeat: true,
        notes: "Min 5 seats. $30/seat if billed monthly.",
      },
      {
        name: "Team Premium",
        price: 100,
        billing: "annual",
        perSeat: true,
        notes:
          "Min 5 seats. $125/seat if billed monthly. Includes Claude Code.",
      },
      {
        name: "Enterprise",
        price: null,
        billing: "custom",
        perSeat: true,
        notes: "Min ~50 seats. Usage billed at API rates on top of seat fee.",
      },
      {
        name: "API",
        price: null,
        billing: "usage",
        perSeat: false,
        notes:
          "Sonnet 4.6: $3/M input, $15/M output. Opus 4.6: $5/M input, $25/M output.",
      },
    ],
  },

  {
    tool: "Gemini",
    category: "chat-ai",
    lastVerified: "2026-05-10",
    plans: [
      {
        name: "Free",
        price: 0,
        billing: "monthly",
        perSeat: false,
      },
      {
        name: "AI Plus",
        price: 7.99,
        billing: "monthly",
        perSeat: false,
        notes: "Launched globally January 2026.",
      },
      {
        name: "AI Pro",
        price: 19.99,
        billing: "monthly",
        perSeat: false,
        notes: "Formerly Google One AI Premium / Gemini Advanced.",
      },
      {
        name: "AI Ultra",
        price: 249.99,
        billing: "monthly",
        perSeat: false,
        notes:
          "Includes 30 TB storage, YouTube Premium, Gemini 3.1 Pro, Veo 3.1.",
      },
      {
        name: "API",
        price: null,
        billing: "usage",
        perSeat: false,
        notes:
          "Gemini 3.1 Pro: $2/M input, $12/M output. Flash-Lite from $0.10/M.",
      },
    ],
  },

  // ── Coding IDEs ────────────────────────────────────────────

  {
    tool: "Cursor",
    category: "coding-ide",
    lastVerified: "2026-05-10",
    plans: [
      {
        name: "Hobby",
        price: 0,
        billing: "monthly",
        perSeat: false,
        notes: "Limited Agent requests and Tab completions. No credit card required.",
      },
      {
        name: "Pro",
        price: 20,
        billing: "monthly",
        perSeat: false,
        notes:
          "Includes $20 credit pool for frontier models. Auto mode is unlimited. $16/mo billed annually.",
      },
      {
        name: "Pro+",
        price: 60,
        billing: "monthly",
        perSeat: false,
        notes: "3x model usage vs Pro.",
      },
      {
        name: "Ultra",
        price: 200,
        billing: "monthly",
        perSeat: false,
        notes: "20x model usage vs Pro.",
      },
      {
        name: "Business",
        price: 40,
        billing: "monthly",
        perSeat: true,
        notes:
          "Formerly 'Teams'. Includes shared rules, usage analytics, SAML/OIDC SSO.",
      },
      {
        name: "Enterprise",
        price: null,
        billing: "custom",
        perSeat: true,
        notes: "Pooled usage, advanced security, invoicing.",
      },
    ],
  },

  {
    tool: "GitHub Copilot",
    category: "coding-ide",
    lastVerified: "2026-05-10",
    plans: [
      {
        name: "Free",
        price: 0,
        billing: "monthly",
        perSeat: false,
        notes: "Limited completions and chat.",
      },
      {
        name: "Pro",
        price: 10,
        billing: "monthly",
        perSeat: false,
        notes:
          "Moving to usage-based (AI Credits) billing on June 1, 2026. New sign-ups temporarily paused.",
      },
      {
        name: "Pro+",
        price: 39,
        billing: "monthly",
        perSeat: false,
        notes:
          "5x+ limits vs Pro. Moving to usage-based billing June 1, 2026.",
      },
      {
        name: "Business",
        price: 19,
        billing: "monthly",
        perSeat: true,
        notes: "Includes $19/seat in monthly AI Credits from June 1, 2026.",
      },
      {
        name: "Enterprise",
        price: 39,
        billing: "monthly",
        perSeat: true,
        notes: "Audit logs, policy controls, Copilot code review.",
      },
    ],
  },

  {
    tool: "Windsurf",
    category: "coding-ide",
    lastVerified: "2026-05-10",
    plans: [
      {
        name: "Free",
        price: 0,
        billing: "monthly",
        perSeat: false,
        notes: "5 prompt credits/month. Unlimited Tab completions.",
      },
      {
        name: "Pro",
        price: 15,
        billing: "monthly",
        perSeat: false,
        notes:
          "500 prompt credits/month. Additional 250 credits for $10 (rollover).",
      },
      {
        name: "Teams",
        price: 30,
        billing: "monthly",
        perSeat: true,
        notes:
          "500 credits/user/month (pooled). Max 200 seats. Additional 1,000 pooled credits for $40.",
      },
      {
        name: "Enterprise",
        price: 60,
        billing: "monthly",
        perSeat: true,
        notes:
          "1,000 credits/user/month. Auth, advanced access controls, analytics API, FedRAMP option.",
      },
    ],
  },
];

// --------------- Helpers -------------------------------------

/**
 * Returns the monthly cost for a plan.
 * Handles per-seat multiplication automatically.
 *
 * @returns number (USD) or null if usage-based / custom pricing
 */
export function calculateMonthlyCost(
  plan: ToolPlan,
  seats: number = 1
): number | null {
  if (plan.price === null) return null;
  return plan.perSeat ? plan.price * seats : plan.price;
}

/**
 * Returns all tools in a given category.
 */
export function getToolsByCategory(category: ToolCategory): ToolPricing[] {
  return pricingData.filter((t) => t.category === category);
}

/**
 * Returns the fixed-price plans for a tool (excludes usage/custom billing).
 * Useful for populating plan-selector dropdowns in the audit form.
 */
export function getSelectablePlans(toolName: string): ToolPlan[] {
  const tool = pricingData.find((t) => t.tool === toolName);
  if (!tool) return [];
  return tool.plans.filter(
    (p) => p.billing !== "usage" && p.billing !== "custom"
  );
}