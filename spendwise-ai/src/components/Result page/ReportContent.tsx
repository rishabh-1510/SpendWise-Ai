import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";

import {
  ArrowDownToLine,
  Calendar,
  Share2,
  Sparkles,
  TrendingDown,
  Zap,
} from "lucide-react";

/* -------------------------------- */
/* Dynamic Data */
/* -------------------------------- */

const auditData = JSON.parse(
  localStorage.getItem("audit-results") ||
    "{}"
);

const formData = JSON.parse(
  localStorage.getItem("audit-form") ||
    "{}"
);

const totalSavings =
  auditData?.savings || 0;

/* -------------------------------- */
/* Breakdown */
/* -------------------------------- */

const breakdown =
  auditData?.recommendations?.map(
    (r: string, i: number) => ({
      id: i,
      recommendation: r,
    })
  ) || [];

/* -------------------------------- */
/* Spend Split */
/* -------------------------------- */

const split =
  formData?.rows?.map((r: any) => ({
    name: r.tool,
    value: Number(r.spend || 0),
    fill: `oklch(${
      0.6 + Math.random() * 0.2
    } 0.22 ${260 + Math.random() * 60})`,
  })) || [];

/* -------------------------------- */
/* Trend */
/* -------------------------------- */

const trend = [
  {
    m: "Current",
    current:
      totalSavings +
      (auditData?.savings || 0),
    optimized: totalSavings,
  },
];

/* -------------------------------- */
/* Component */
/* -------------------------------- */

export function ReportContent({
  shared = false,
}: {
  shared?: boolean;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {shared
              ? "Public Audit Report"
              : "Audit Results"}
          </p>

          <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">
            AI Spend Audit Report
          </h1>

          <p className="mt-2 text-muted-foreground text-sm">
            Generated dynamically from
            your audit form
          </p>
        </div>

        {!shared && (
          <div className="flex flex-wrap gap-2">
            <Button variant="glass">
              <ArrowDownToLine className="h-4 w-4" />
              Download
            </Button>

            <Button variant="glass">
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            <Button variant="hero">
              <Calendar className="h-4 w-4" />
              Book consultation
            </Button>
          </div>
        )}
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl glass-strong glow-border p-8 md:p-12">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />

        <div className="relative grid md:grid-cols-2 gap-6 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-success/15 text-success border border-success/20">
              <TrendingDown className="h-3 w-3" />
              Savings detected
            </span>

            <h2 className="mt-4 text-3xl md:text-4xl font-medium text-muted-foreground">
              Estimated savings
            </h2>

            <p className="mt-2 text-6xl md:text-7xl font-semibold text-gradient-brand tracking-tight">
              $
              {totalSavings.toLocaleString()}
              <span className="text-2xl text-muted-foreground font-normal">
                /year
              </span>
            </p>

            <p className="mt-4 text-muted-foreground max-w-md">
              SpendWise detected
              optimization opportunities
              through plan right-sizing,
              seat optimization, and tool
              consolidation.
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Optimization score"
              value={`${auditData?.score || 0}`}
              sub="/100"
            />

            <MetricCard
              label="Potential savings"
              value={`$${totalSavings.toLocaleString()}`}
              sub="/year"
              accent="success"
            />

            <MetricCard
              label="Recommendations"
              value={`${breakdown.length}`}
              sub="detected"
            />

            <MetricCard
              label="Tools analyzed"
              value={`${
                split.length || 0
              }`}
              sub="tools"
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Bar Chart */}
        <div className="md:col-span-2 glass rounded-2xl p-6">
          <div className="flex justify-between items-baseline mb-4">
            <div>
              <h3 className="font-semibold">
                Spend Comparison
              </h3>

              <p className="text-xs text-muted-foreground">
                Current vs optimized
                annual spend
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={trend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.28 0.03 265 / 0.4)"
                />

                <XAxis
                  dataKey="m"
                  stroke="oklch(0.6 0.02 260)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="oklch(0.6 0.02 260)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  contentStyle={{
                    background:
                      "oklch(0.18 0.025 270)",
                    border:
                      "1px solid oklch(0.28 0.03 265)",
                    borderRadius: 12,
                  }}
                />

                <Bar
                  dataKey="current"
                  fill="oklch(0.65 0.22 270)"
                  radius={[6, 6, 0, 0]}
                />

                <Bar
                  dataKey="optimized"
                  fill="oklch(0.72 0.18 155)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold">
            Spend by Tool
          </h3>

          <p className="text-xs text-muted-foreground">
            Share of monthly spend
          </p>

          <div className="h-48 mt-2">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={split}
                  dataKey="value"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {split.map((s: any) => (
                    <Cell
                      key={s.name}
                      fill={s.fill}
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    background:
                      "oklch(0.18 0.025 270)",
                    border:
                      "1px solid oklch(0.28 0.03 265)",
                    borderRadius: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="space-y-1.5 mt-2 text-xs">
            {split.map((s: any) => (
              <li
                key={s.name}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: s.fill,
                    }}
                  />

                  {s.name}
                </span>

                <span className="font-mono">
                  ${s.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI Summary */}
      <div className="glass glow-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>

          <h3 className="font-semibold">
            AI-Generated Summary
          </h3>
        </div>

        <p className="text-foreground/85 leading-relaxed">
          {auditData.summary}
          <span className="text-success font-semibold">
            {" "}
            $
            {totalSavings.toLocaleString()}
          </span>
          .
        </p>
      </div>

      {/* Recommendations */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h3 className="font-semibold">
            Recommendations
          </h3>

          <p className="text-xs text-muted-foreground">
            Optimization opportunities
            detected by audit engine
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border/50">
                <th className="text-left p-4 font-medium">
                  Type
                </th>

                <th className="text-left p-4 font-medium">
                  Recommendation
                </th>

                <th className="text-right p-4 font-medium">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {breakdown.map((r: any) => (
                <tr
                  key={r.id}
                  className="border-b border-border/30 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="p-4 font-medium">
                    Optimization
                  </td>

                  <td className="p-4 text-muted-foreground">
                    {r.recommendation}
                  </td>

                  <td className="p-4 text-right font-mono text-success">
                    Active
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expert CTA */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-brand p-[1px]">
        <div className="rounded-2xl bg-card p-8 md:flex items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-primary">
              <Zap className="h-3 w-3" />
              EXPERT INSIGHT
            </div>

            <h3 className="mt-2 text-2xl font-semibold">
              Reduce costs even
              further
            </h3>

            <p className="mt-2 text-muted-foreground max-w-xl">
              SpendWise can help teams
              optimize vendor contracts,
              reduce tool overlap, and
              improve AI spending
              efficiency.
            </p>
          </div>

          <Button
            variant="hero"
            size="lg"
            className="mt-4 md:mt-0 shrink-0"
          >
            Book consultation
          </Button>
        </div>
      </div>

      {/* Footer Buttons */}
      {!shared && (
        <div className="flex flex-wrap gap-3 justify-center pt-4">
          <Button
            variant="glass"
            size="lg"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Download Report
          </Button>

          <Button
            variant="glass"
            size="lg"
          >
            <Share2 className="h-4 w-4" />
            Share Audit
          </Button>

          <Button
            variant="hero"
            size="lg"
          >
            <Calendar className="h-4 w-4" />
            Book Consultation
          </Button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- */
/* Metric Card */
/* -------------------------------- */

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: "success";
}) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-semibold ${
          accent === "success"
            ? "text-success"
            : ""
        }`}
      >
        {value}{" "}
        <span className="text-xs text-muted-foreground font-normal">
          {sub}
        </span>
      </p>
    </div>
  );
}
