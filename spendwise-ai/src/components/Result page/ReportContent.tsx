import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  ArrowDownToLine, Calendar, Share2, Check, TrendingDown, Zap, AlertTriangle, Copy,
} from "lucide-react";
import type { AuditResult, Recommendation } from "@/utils/auditEngine";
import { AISummaryCard } from "./AiSummaryCard";

/* ─────────────────────────────────────── */
/* Types                                   */
/* ─────────────────────────────────────── */

type StoredResult = AuditResult & { summary?: string };

/* ─────────────────────────────────────── */
/* Constants                               */
/* ─────────────────────────────────────── */

const CHART_COLORS = [
  "#8b5cf6", "#22c55e", "#facc15", "#ec4899",
  "#38bdf8", "#f97316", "#84cc16", "#6366f1",
];

const PRIORITY_META = {
  high: { label: "High", className: "text-destructive bg-destructive/10 border-destructive/20" },
  medium: { label: "Medium", className: "text-amber-400  bg-amber-400/10  border-amber-400/20" },
  low: { label: "Low", className: "text-muted-foreground bg-muted/40 border-border" },
} as const;

const URL_SIZE_WARN = 6_000; // bytes — warn before hitting browser limits

/* ─────────────────────────────────────── */
/* Data loading                            */
/* ─────────────────────────────────────── */

/**
 * Decode audit data from a `?data=` URL param (shared view).
 * Returns null if the param is absent or malformed.
 */
function decodeFromUrl(searchParams: URLSearchParams): StoredResult | null {
  const param = searchParams.get("data");
  if (!param) return null;
  try {
    const json = atob(decodeURIComponent(param));
    const parsed = JSON.parse(json) as StoredResult;
    if (typeof parsed.score !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Load from localStorage (owner view). */
function loadFromStorage(): StoredResult | null {
  try {
    const raw = localStorage.getItem("audit-results");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredResult;
    if (typeof parsed.score !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Encode audit data into a share URL.
 * Returns { url, tooBig } where tooBig flags if the URL exceeds URL_SIZE_WARN.
 */
function buildShareUrl(audit: StoredResult): { url: string; tooBig: boolean } {
  const json = JSON.stringify(audit);
  const encoded = encodeURIComponent(btoa(json));
  const url = `${window.location.origin}/report?data=${encoded}`;
  return { url, tooBig: url.length > URL_SIZE_WARN };
}

/* ─────────────────────────────────────── */
/* Share button                            */
/* ─────────────────────────────────────── */

type ShareState = "idle" | "copying" | "copied" | "error";

function ShareButton({ audit }: { audit: StoredResult }) {
  const [state, setState] = useState<ShareState>("idle");

  const handleShare = async () => {
    setState("copying");

    const { url, tooBig } = buildShareUrl(audit);

    if (tooBig) {
      // Still copy but warn — URL will likely work but is large
      console.warn(`[Share] URL is ${url.length} chars — may hit browser limits.`);
    }

    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
      setTimeout(() => setState("idle"), 2_500);
    } catch {
      // Clipboard API unavailable (non-HTTPS, denied permission)
      // Fall back to a temporary <textarea> copy trick
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setState("copied");
        setTimeout(() => setState("idle"), 2_500);
      } catch {
        setState("error");
        setTimeout(() => setState("idle"), 2_500);
      }
    }
  };

  const label =
    state === "copying" ? "Copying…" :
      state === "copied" ? "Link copied!" :
        state === "error" ? "Copy failed" :
          "Share";

  const icon =
    state === "copied" ? <Check className="h-4 w-4" /> :
      state === "error" ? <Copy className="h-4 w-4" /> :
        <Share2 className="h-4 w-4" />;

  return (
    <Button
      variant="glass"
      onClick={handleShare}
      disabled={state === "copying"}
      className={
        state === "copied" ? "text-success border-success/30" :
          state === "error" ? "text-destructive border-destructive/30" : ""
      }
    >
      {icon}
      {label}
    </Button>
  );
}

/* ─────────────────────────────────────── */
/* Component                               */
/* ─────────────────────────────────────── */

export function ReportContent({ shared = false }: { shared?: boolean }) {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const reportRef = useRef<HTMLDivElement>(null);

  // Shared view reads from URL; owner view reads from localStorage
  const audit = useMemo(
    () => shared ? decodeFromUrl(searchParams) : loadFromStorage(),
    [shared, searchParams]
  );

  /* ── PDF download (unchanged) ── */
  const handleDownloadReport = async () => {
    if (!reportRef.current) return;
    const { default: domtoimage } = await import("dom-to-image-more");
    const { default: jsPDF } = await import("jspdf");

    const A4_WIDTH_PX = 794;
    const scale = 3;
    const node = reportRef.current;

    const container = document.createElement("div");
    container.style.cssText = `
      position:fixed;top:0;left:-9999px;
      width:${A4_WIDTH_PX}px;min-width:${A4_WIDTH_PX}px;max-width:${A4_WIDTH_PX}px;
      overflow:visible;z-index:-1;pointer-events:none;
    `;
    const clone = node.cloneNode(true) as HTMLElement;
    clone.style.width = `${A4_WIDTH_PX}px`;
    clone.style.minWidth = `${A4_WIDTH_PX}px`;
    clone.style.maxWidth = `${A4_WIDTH_PX}px`;
    clone.style.overflow = "visible";
    container.appendChild(clone);
    document.body.appendChild(container);
    await new Promise((res) => setTimeout(res, 150));

    const captureWidth = A4_WIDTH_PX * scale;
    const captureHeight = container.scrollHeight * scale;

    try {
      const dataUrl = await domtoimage.toPng(container, {
        width: captureWidth, height: captureHeight,
        style: {
          transform: `scale(${scale})`, transformOrigin: "top left",
          width: `${A4_WIDTH_PX}px`, height: `${container.scrollHeight}px`,
        },
        cacheBust: true,
        filter: (el: Element) => {
          if (!(el instanceof HTMLElement)) return true;
          const s = getComputedStyle(el);
          el.style.backdropFilter = "none";
          (el.style as any).webkitBackdropFilter = "none";
          const bg = s.backgroundColor;
          if (bg === "rgba(0,0,0,0)" || bg === "transparent" || bg.includes("oklch"))
            el.style.backgroundColor = "#0f172a";
          if (s.background.includes("gradient")) {
            el.style.backgroundImage = "none";
            el.style.backgroundColor = "#1e293b";
          }
          if (el.classList.contains("text-gradient-brand") ||
            (s.webkitTextFillColor !== "" && s.webkitTextFillColor !== "rgba(0,0,0,0)")) {
            el.style.backgroundImage = "none";
            el.style.backgroundClip = "unset";
            (el.style as any).webkitBackgroundClip = "unset";
            (el.style as any).webkitTextFillColor = "#a78bfa";
            el.style.color = "#a78bfa";
          }
          if (s.borderColor.includes("oklch")) el.style.borderColor = "#334155";
          if (s.color.includes("oklch")) el.style.color = "#e2e8f0";
          return true;
        },
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4", hotfixes: ["px_scaling"] });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (captureHeight / captureWidth) * pdfWidth;
      const totalPages = Math.ceil(imgHeight / pdfHeight);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, -(i * pdfHeight), pdfWidth, imgHeight);
      }
      pdf.save("spendwise-audit-report.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      document.body.removeChild(container);
    }
  };

  /* ── Empty / error states ── */
  if (!audit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-semibold">
          {shared ? "Invalid or expired share link" : "No audit data found"}
        </h2>
        <p className="text-muted-foreground max-w-sm">
          {shared
            ? "This link may be malformed or the data was too large for a URL."
            : "Run an audit first to see your report."}
        </p>
        {!shared && (
          <Button variant="hero" onClick={() => nav("/audit")}>
            Start audit
          </Button>
        )}
      </div>
    );
  }

  const { score, totalMonthly, totalAnnual, savingsAnnual, recommendations, summary } = audit;

  /* ── Chart data ── */
  const optimizedAnnual = Math.max(0, totalAnnual - savingsAnnual);
  const comparisonData = [
    { label: "Current", value: totalAnnual },
    { label: "Optimized", value: optimizedAnnual },
  ];

  const pieData = useMemo(() => {
    // Shared view: reconstruct from recommendations if form data unavailable
    try {
      const raw = localStorage.getItem("audit-form-v2");
      if (raw) {
        const { rows } = JSON.parse(raw) as { rows: { tool: string; spend: number | null }[] };
        const filtered = rows.filter((r) => r.tool && r.spend !== null && r.spend > 0);
        if (filtered.length > 0)
          return filtered.map((r, i) => ({
            name: r.tool, value: r.spend as number,
            fill: CHART_COLORS[i % CHART_COLORS.length],
          }));
      }
    } catch { /* fall through */ }

    // Fallback: aggregate savings per tool from recommendations
    const toolMap = new Map<string, number>();
    recommendations.forEach((r) => {
      if (r.savingsMonthly > 0)
        toolMap.set(r.tool, (toolMap.get(r.tool) ?? 0) + r.savingsMonthly);
    });
    return Array.from(toolMap.entries()).map(([name, value], i) => ({
      name, value, fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [recommendations]);

  /* ── Render ── */
  return (
    <div ref={reportRef}>
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-8">

        {/* Header */}
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

          {/* Action buttons — always show Download; show Share only for owner */}
          <div className="flex flex-wrap gap-2">
            <Button variant="glass" onClick={handleDownloadReport}>
              <ArrowDownToLine className="h-4 w-4" />
              Download
            </Button>
            {!shared && <ShareButton audit={audit} />}
            {!shared && (
              <Button variant="hero">
                <Calendar className="h-4 w-4" />
                Book consultation
              </Button>
            )}
          </div>
        </div>

        {/* Shared-view banner */}
        {shared && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground">
            <Share2 className="h-4 w-4 shrink-0" />
            <span>
              This is a read-only shared report.{" "}
              <a href="/audit" className="text-foreground underline underline-offset-2 hover:text-primary">
                Run your own audit →
              </a>
            </span>
          </div>
        )}

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
                ${savingsAnnual.toLocaleString()}
                <span className="text-2xl text-muted-foreground font-normal">/year</span>
              </p>
              <p className="mt-4 text-muted-foreground max-w-md">
                SpendWise detected optimization opportunities through plan right-sizing,
                seat optimization, and tool consolidation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Optimization score" value={`${score}`} sub="/100" />
              <MetricCard label="Potential savings" value={`$${savingsAnnual.toLocaleString()}`} sub="/year" accent="success" />
              <MetricCard label="Recommendations" value={`${recommendations.length}`} sub="detected" />
              <MetricCard label="Monthly spend" value={`$${totalMonthly.toLocaleString()}`} sub="/month" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-5 md:grid-cols-3">
          <div className="md:col-span-2 glass rounded-2xl p-6">
            <div className="mb-4">
              <h3 className="font-semibold">Spend Comparison</h3>
              <p className="text-xs text-muted-foreground">Current vs. optimized annual spend</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={comparisonData} barSize={56}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#8b5cf6" vertical={false} />
                  <XAxis dataKey="label" stroke="#8b5cf6" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8b5cf6" fontSize={11} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `$${(v as number).toLocaleString()}`} />
                  <Tooltip
                    cursor={{ fill: "rgba(139,92,246,0.3)" }}
                    contentStyle={{ background: "#1e1b2e", border: "1px solid #312e81", borderRadius: 12, fontSize: 12 }}
                    formatter={(v) => [`$${(v as number).toLocaleString()}`, "Annual spend"]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#22c55e" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
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

          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold">Spend by Tool</h3>
            <p className="text-xs text-muted-foreground mb-2">Share of monthly spend</p>
            {pieData.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={70}
                        paddingAngle={2} isAnimationActive={false}>
                        {pieData.map((s) => <Cell key={s.name} fill={s.fill} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#1e1b2e", border: "1px solid #312e81", borderRadius: 12, fontSize: 12 }}
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

        {/* AI Summary */}
        {summary && (
          <AISummaryCard
            summary={summary}
            generatedAt={new Date().toLocaleTimeString()}
            model="Gemini 2.5 Flash"
          />
        )}

        {/* Recommendations */}
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
                ) : recommendations.map((r: Recommendation, i: number) => {
                  const meta = PRIORITY_META[r.priority];
                  return (
                    <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-medium whitespace-nowrap">{r.tool}</td>
                      <td className="p-4 text-muted-foreground">{r.issue}</td>
                      <td className="p-4 text-muted-foreground max-w-xs">{r.action}</td>
                      <td className="p-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.className}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-success whitespace-nowrap">
                        {r.savingsMonthly > 0 ? `$${(r.savingsMonthly * 12).toLocaleString()}/yr` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
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

        {/* Footer */}
        {!shared && (
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <Button variant="glass" size="lg" onClick={handleDownloadReport}>
              <ArrowDownToLine className="h-4 w-4" />
              Download Report
            </Button>
            <ShareButton audit={audit} />
            <Button variant="hero" size="lg">
              <Calendar className="h-4 w-4" />
              Book Consultation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── */
/* MetricCard                              */
/* ─────────────────────────────────────── */

function MetricCard({ label, value, sub, accent }: {
  label: string; value: string; sub: string; accent?: "success";
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
