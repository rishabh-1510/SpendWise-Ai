import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  ArrowDownToLine,
  Calendar,
  Share2,
  Sparkles,
  TrendingDown,
  Zap,
  AlertTriangle,
} from "lucide-react";
import type { AuditResult, Recommendation } from "@/utils/auditEngine";

/* ─────────────────────────────────────── */
/* Types                                   */
/* ─────────────────────────────────────── */

type StoredResult = AuditResult & { summary?: string };

/* ─────────────────────────────────────── */
/* Constants                               */
/* ─────────────────────────────────────── */

// Deterministic palette — no Math.random(), no flicker
const CHART_COLORS = [
  "oklch(0.70 0.22 270)",
  "oklch(0.72 0.18 155)",
  "oklch(0.72 0.20 55)",
  "oklch(0.70 0.20 320)",
  "oklch(0.68 0.18 200)",
  "oklch(0.70 0.16 30)",
  "oklch(0.72 0.20 100)",
  "oklch(0.68 0.18 240)",
];

const PRIORITY_META = {
  high:   { label: "High",   className: "text-destructive bg-destructive/10 border-destructive/20" },
  medium: { label: "Medium", className: "text-amber-400  bg-amber-400/10  border-amber-400/20"    },
  low:    { label: "Low",    className: "text-muted-foreground bg-muted/40 border-border"          },
} as const;

/* ─────────────────────────────────────── */
/* Data loading — inside component         */
/* ─────────────────────────────────────── */

function loadAuditResult(): StoredResult | null {
  try {
    const raw = localStorage.getItem("audit-results");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredResult;
    // Minimal shape check
    if (typeof parsed.score !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────── */
/* Component                               */
/* ─────────────────────────────────────── */

export function ReportContent({ shared = false }: { shared?: boolean }) {
  const nav = useNavigate();

  // Read inside the component so navigation back + re-render picks up fresh data
  const audit = useMemo(loadAuditResult, []);

  // Empty state — no valid data in storage
  if (!audit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No audit data found</h2>
        <p className="text-muted-foreground max-w-sm">
          Run an audit first to see your report.
        </p>
        <Button variant="hero" onClick={() => nav("/audit")}>
          Start audit
        </Button>
      </div>
    );
  }

  const {
    score,
    totalMonthly,
    totalAnnual,
    savingsAnnual,
    recommendations,
    summary,
  } = audit;

  /* ── Derived chart data ── */

  // Bar chart: current annual spend vs. optimized
  const optimizedAnnual = Math.max(0, totalAnnual - savingsAnnual);
  const comparisonData = [
    { label: "Current",   value: totalAnnual    },
    { label: "Optimized", value: optimizedAnnual },
  ];

  // Pie chart: per-tool monthly spend, built from recommendations tool names
  // and totalMonthly. We reconstruct from the rows stored alongside results.
  const pieData: { name: string; value: number; fill: string }[] = useMemo(() => {
    try {
      const raw = localStorage.getItem("audit-form-v2");
      if (!raw) return [];
      const { rows } = JSON.parse(raw) as { rows: { tool: string; spend: number | null }[] };
      return rows
        .filter((r) => r.tool && r.spend !== null && r.spend > 0)
        .map((r, i) => ({
          name:  r.tool,
          value: r.spend as number,
          fill:  CHART_COLORS[i % CHART_COLORS.length],
        }));
    } catch {
      return [];
    }
  }, []);

  /* ── Render ── */

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {shared ? "Public Audit Report" : "Audit Results"}
          </p>
          <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">
            AI Spend Audit Report
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            {recommendations.length} optimization{" "}
            {recommendations.length !== 1 ? "opportunities" : "opportunity"} detected
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

      {/* ── Hero banner ── */}
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
              ${savingsAnnual.toLocaleString()}
              <span className="text-2xl text-muted-foreground font-normal">/year</span>
            </p>

            <p className="mt-4 text-muted-foreground max-w-md">
              SpendWise detected optimization opportunities through plan right-sizing,
              seat optimization, and tool consolidation.
            </p>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Optimization score"
              value={`${score}`}
              sub="/100"
            />
            <MetricCard
              label="Potential savings"
              value={`$${savingsAnnual.toLocaleString()}`}
              sub="/year"
              accent="success"
            />
            <MetricCard
              label="Recommendations"
              value={`${recommendations.length}`}
              sub="detected"
            />
            <MetricCard
              label="Monthly spend"
              value={`$${totalMonthly.toLocaleString()}`}
              sub="/month"
            />
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid gap-5 md:grid-cols-3">

        {/* Bar chart — current vs optimized */}
        <div className="md:col-span-2 glass rounded-2xl p-6">
          <div className="mb-4">
            <h3 className="font-semibold">Spend Comparison</h3>
            <p className="text-xs text-muted-foreground">Current vs. optimized annual spend</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={comparisonData} barSize={56}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.28 0.03 265 / 0.4)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="oklch(0.6 0.02 260)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.6 0.02 260)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v as number).toLocaleString()}`}
                />
                <Tooltip
                  cursor={{ fill: "oklch(0.28 0.03 265 / 0.3)" }}
                  contentStyle={{
                    background: "oklch(0.18 0.025 270)",
                    border: "1px solid oklch(0.28 0.03 265)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v) => [`$${(v as number).toLocaleString()}`, "Annual spend"]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  <Cell fill="oklch(0.65 0.22 270)" />
                  <Cell fill="oklch(0.72 0.18 155)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Manual legend since we use Cell not two Bar keys */}
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[oklch(0.65_0.22_270)]" />
              Current (${totalAnnual.toLocaleString()}/yr)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[oklch(0.72_0.18_155)]" />
              Optimized (${optimizedAnnual.toLocaleString()}/yr)
            </span>
          </div>
        </div>

        {/* Pie chart — spend by tool */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold">Spend by Tool</h3>
          <p className="text-xs text-muted-foreground mb-2">Share of monthly spend</p>

          {pieData.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      isAnimationActive={false}
                    >
                      {pieData.map((s) => (
                        <Cell key={s.name} fill={s.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.18 0.025 270)",
                        border: "1px solid oklch(0.28 0.03 265)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(v) => [`$${(v as number).toLocaleString()}/mo`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="space-y-1.5 text-xs">
                {pieData.map((s) => (
                  <li key={s.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: s.fill }} />
                      {s.name}
                    </span>
                    <span className="font-mono">${s.value.toLocaleString()}/mo</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-xs text-muted-foreground mt-4">No spend data available.</p>
          )}
        </div>
      </div>

      {/* ── AI Summary ── */}
      {summary && (
        <div className="glass glow-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <h3 className="font-semibold">AI-Generated Summary</h3>
          </div>
          <p className="text-foreground/85 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* ── Recommendations table ── */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Recommendations</h3>
            <p className="text-xs text-muted-foreground">
              Optimization opportunities detected by audit engine
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20">
            ${savingsAnnual.toLocaleString()} total savings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border/50">
                <th className="text-left p-4 font-medium">Tool</th>
                <th className="text-left p-4 font-medium">Issue</th>
                <th className="text-left p-4 font-medium">Action</th>
                <th className="text-center p-4 font-medium">Priority</th>
                <th className="text-right p-4 font-medium">Saves</th>
              </tr>
            </thead>

            <tbody>
              {recommendations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                    No recommendations — your AI stack looks well-optimized.
                  </td>
                </tr>
              ) : (
                recommendations.map((r: Recommendation, i: number) => {
                  const meta = PRIORITY_META[r.priority];
                  return (
                    <tr
                      key={i}
                      className="border-b border-border/30 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-4 font-medium whitespace-nowrap">{r.tool}</td>
                      <td className="p-4 text-muted-foreground">{r.issue}</td>
                      <td className="p-4 text-muted-foreground max-w-xs">{r.action}</td>
                      <td className="p-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.className}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-success whitespace-nowrap">
                        {r.savingsMonthly > 0
                          ? `$${(r.savingsMonthly * 12).toLocaleString()}/yr`
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Expert CTA ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-brand p-[1px]">
        <div className="rounded-2xl bg-card p-8 md:flex items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-primary">
              <Zap className="h-3 w-3" />
              EXPERT INSIGHT
            </div>
            <h3 className="mt-2 text-2xl font-semibold">Reduce costs even further</h3>
            <p className="mt-2 text-muted-foreground max-w-xl">
              SpendWise can help teams optimize vendor contracts, reduce tool overlap,
              and improve AI spending efficiency.
            </p>
          </div>
          <Button variant="hero" size="lg" className="mt-4 md:mt-0 shrink-0">
            Book consultation
          </Button>
        </div>
      </div>

      {/* ── Footer actions ── */}
      {!shared && (
        <div className="flex flex-wrap gap-3 justify-center pt-4">
          <Button variant="glass" size="lg">
            <ArrowDownToLine className="h-4 w-4" />
            Download Report
          </Button>
          <Button variant="glass" size="lg">
            <Share2 className="h-4 w-4" />
            Share Audit
          </Button>
          <Button variant="hero" size="lg">
            <Calendar className="h-4 w-4" />
            Book Consultation
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────── */
/* MetricCard                              */
/* ─────────────────────────────────────── */

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
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent === "success" ? "text-success" : ""}`}>
        {value}{" "}
        <span className="text-xs text-muted-foreground font-normal">{sub}</span>
      </p>
    </div>
  );
}