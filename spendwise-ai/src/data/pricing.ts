
export type ToolPlan = {
  name: string;
  price: number | null;
  billing: "monthly" | "usage";
};

export type ToolPricing = {
  tool: string;
  plans: ToolPlan[];
};

export const pricingData: ToolPricing[] = [
  {
    tool: "Cursor",
    plans: [
      { name: "Hobby", price: 0, billing: "monthly" },
      { name: "Pro", price: 20, billing: "monthly" },
      { name: "Pro+", price: 60, billing: "monthly" },
      { name: "Teams", price: 40, billing: "monthly" },
      { name: "Enterprise", price: null, billing: "monthly" },
    ],
  },

  {
    tool: "GitHub Copilot",
    plans: [
      { name: "Free", price: 0, billing: "monthly" },
      { name: "Pro", price: 10, billing: "monthly" },
      { name: "Business", price: 19, billing: "monthly" },
      { name: "Enterprise", price: 39, billing: "monthly" },
    ],
  },

  {
    tool: "ChatGPT",
    plans: [
      { name: "Free", price: 0, billing: "monthly" },
      { name: "Plus", price: 20, billing: "monthly" },
      { name: "Team", price: 30, billing: "monthly" },
      { name: "Enterprise", price: null, billing: "monthly" },
      { name: "API Direct", price: null, billing: "usage" },
    ],
  },

  {
    tool: "Claude",
    plans: [
      { name: "Free", price: 0, billing: "monthly" },
      { name: "Pro", price: 20, billing: "monthly" },
      { name: "Max", price: 100, billing: "monthly" },
      { name: "Team", price: 30, billing: "monthly" },
      { name: "Enterprise", price: null, billing: "monthly" },
      { name: "API Direct", price: null, billing: "usage" },
    ],
  },

  {
    tool: "Gemini",
    plans: [
      { name: "Free", price: 0, billing: "monthly" },
      { name: "Pro", price: 20, billing: "monthly" },
      { name: "Ultra", price: 250, billing: "monthly" },
      { name: "API", price: null, billing: "usage" },
    ],
  },

  {
    tool: "OpenAI API",
    plans: [
      { name: "GPT-4o", price: null, billing: "usage" },
      { name: "GPT-4 Turbo", price: null, billing: "usage" },
    ],
  },

  {
    tool: "Anthropic API",
    plans: [
      { name: "Claude Sonnet", price: null, billing: "usage" },
      { name: "Claude Opus", price: null, billing: "usage" },
    ],
  },

  {
    tool: "Windsurf",
    plans: [
      { name: "Free", price: 0, billing: "monthly" },
      { name: "Pro", price: 15, billing: "monthly" },
      { name: "Teams", price: 30, billing: "monthly" },
    ],
  },
];