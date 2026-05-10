import { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
import { AISummaryCard } from "./AiSummaryCard";
import { patchOklchVars } from "@/utils/pdfExport";

/* ─────────────────────────────────────── */
/* Types                                   */
/* ─────────────────────────────────────── */

type StoredResult = AuditResult & { summary?: string };

/* ─────────────────────────────────────── */
/* Constants                               */
/* ─────────────────────────────────────── */

// Deterministic palette — no Math.random(), no flicker
const CHART_COLORS = [
  "#8b5cf6",
  "#22c55e",
  "#facc15",
  "#ec4899",
  "#38bdf8",
  "#f97316",
  "#84cc16",
  "#6366f1",
];

const PRIORITY_META = {
  high: { label: "High", className: "text-destructive bg-destructive/10 border-destructive/20" },
  medium: { label: "Medium", className: "text-amber-400  bg-amber-400/10  border-amber-400/20" },
  low: { label: "Low", className: "text-muted-foreground bg-muted/40 border-border" },
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
  const reportRef = useRef<HTMLDivElement>(null);
  // Read inside the component so navigation back + re-render picks up fresh data
  const audit = useMemo(loadAuditResult, []);
  // In ReportContent.tsx

  const handleDownloadReport = async () => {
    if (!reportRef.current) return;

    // 1. Patch CSS vars BEFORE html2canvas reads anything
    const patch = patchOklchVars();

    // 2. Flush styles — give the browser one frame to apply them
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0f1117",
        logging: false,
        foreignObjectRendering: false,
        ignoreElements: (el) =>
          el.tagName === "IFRAME" || el.id === "__pdf-patch__",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("spendwise-audit-report.pdf");

    } finally {
      // 3. Always clean up, even on error
      patch.remove();
    }
  };
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
    { label: "Current", value: totalAnnual },
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
          name: r.tool,
          value: r.spend as number,
          fill: CHART_COLORS[i % CHART_COLORS.length],
        }));
    } catch {
      return [];
    }
  }, []);

  /* ── Render ── */

  return (
    <div ref={reportRef} >
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
              <Button variant="glass" onClick={handleDownloadReport}>
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
                  stroke="#8b5cf6"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="#8b5cf6"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#8b5cf6"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v as number).toLocaleString()}`}
                />
                <Tooltip
                  cursor={{ fill:  "rgba(139, 92, 246, 0.3)" }}
                  contentStyle={{
                    background: "#1e1b2e",
                    border: "1px solid #312e81",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v) => [`$${(v as number).toLocaleString()}`, "Annual spend"]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#22c55e" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Manual legend since we use Cell not two Bar keys */}
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              Current (${totalAnnual.toLocaleString()}/yr)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />
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
                        background: "#1e1b2e",
                        border: "1px solid #312e81",
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
      {
        summary && (
          <AISummaryCard
            summary={summary}
            generatedAt={new Date().toLocaleTimeString()}
            model="Gemini 2.5 Flash"
          />
        )
      }

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
      {
        !shared && (
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <Button variant="glass" size="lg" onClick={handleDownloadReport}>
              <ArrowDownToLine className="h-4 w-4" />
              Download Report
            </Button>
            <Button variant="glass" size="lg" >
              <Share2 className="h-4 w-4" />
              Share Audit
            </Button>
            <Button variant="hero" size="lg">
              <Calendar className="h-4 w-4" />
              Book Consultation
            </Button>
          </div>
        )
      }
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