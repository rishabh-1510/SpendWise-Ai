import { Label } from "@/components/ui/label";
import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, Sparkles, Check } from "lucide-react";
import { generateAISummary } from "@/services/aiSummary";
import { saveLead } from "@/services/saveLead";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { runAudit } from "@/utils/auditEngine";
import {
  pricingData,
  getSelectablePlans,
  calculateMonthlyCost,
} from "@/data/pricing";

/* ─────────────────────────────────────── */
/* Constants                               */
/* ─────────────────────────────────────── */

const TOOLS = pricingData.map((t) => t.tool);

const USE_CASES = [
  { id: "coding", label: "Coding" },
  { id: "writing", label: "Writing" },
  { id: "research", label: "Research" },
  { id: "mixed", label: "Mixed" },
] as const;

type UseCase = (typeof USE_CASES)[number]["id"];

/* ─────────────────────────────────────── */
/* Row type                                */
/* ─────────────────────────────────────── */

type Row = {
  tool: string;
  plan: string;
  seats: number;
  /** null = usage-based / custom — displayed as "Usage-based" */
  spend: number | null;
};

const emptyRow = (): Row => ({ tool: "", plan: "", seats: 1, spend: null });

/* ─────────────────────────────────────── */
/* Persistence                             */
/* ─────────────────────────────────────── */

const STORAGE_KEY = "audit-form-v2";

type PersistedState = {
  rows: Row[];
  useCase: UseCase;
  teamSize: number;
};

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedState;
  } catch {
    // ignore malformed data
  }
  return { rows: [emptyRow()], useCase: "coding", teamSize: 1 };
}

function saveState(state: PersistedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ─────────────────────────────────────── */
/* Spend calculation                       */
/* ─────────────────────────────────────── */

function computeSpend(row: Row): number | null {
  const plan = getSelectablePlans(row.tool).find((p) => p.name === row.plan);
  if (!plan) return null;
  return calculateMonthlyCost(plan, row.seats);
}

/* ─────────────────────────────────────── */
/* Component                               */
/* ─────────────────────────────────────── */

const AuditForm = () => {
  const nav = useNavigate();

  // useState lazy initializer — loadState() runs exactly once, not on every render
  const [rows, setRows] = useState<Row[]>(() => loadState().rows);
  const [useCase, setUseCase] = useState<UseCase>(() => loadState().useCase);
  const [teamSize, setTeamSize] = useState<number>(() => loadState().teamSize);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  /* Persist on every change */
  useEffect(() => {
    saveState({ rows, useCase, teamSize });
  }, [rows, useCase, teamSize]);

  /* ── Row helpers ── */

  const updateRow = (i: number, patch: Partial<Row>) =>
    setRows((prev) =>
      prev.map((row, idx) => {
        if (idx !== i) return row;
        const next = { ...row, ...patch };
        return { ...next, spend: computeSpend(next) };
      })
    );

  const addRow = () => setRows((r) => [...r, emptyRow()]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  /* ── Live audit for sidebar figures ──
     Runs the real engine so the sidebar always agrees with the report.
     useMemo keeps it from re-running on unrelated state changes.        */
  const liveAudit = useMemo(
    () => runAudit(rows, useCase, teamSize),
    [rows, useCase, teamSize]
  );

  /* ── Submit ── */

  const handleGenerate = async () => {
    if (!rows.some((r) => r.tool && r.plan)) return;

    setLoading(true);
    try {
      // Re-use the already-computed result rather than running the engine twice
      const summary = await generateAISummary(liveAudit);
      await saveLead({
        email,
        company,
        role,
        teamSize,
        savings:
          liveAudit.savingsAnnual,
      });
      localStorage.setItem(
        "audit-results",
        JSON.stringify({ ...liveAudit, summary })
      );

      nav("/results");
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ── */

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Heading */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Step 1 of 1
          </p>
          <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">
            Tell us about your{" "}
            <span className="text-gradient-brand">AI stack</span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Add the tools your team pays for. We'll find inefficiencies, plan
            mismatches, and optimization opportunities.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* ── Tool Rows ── */}
          <div className="space-y-6">
            {rows.map((row, i) => {
              const plans = getSelectablePlans(row.tool);
              const selectedPlan = plans.find((p) => p.name === row.plan);
              const isPerSeat = selectedPlan?.perSeat ?? false;

              return (
                <div
                  key={i}
                  className="glass glow-border rounded-2xl p-6 animate-fade-up"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="h-6 w-6 rounded-md bg-gradient-brand flex items-center justify-center text-xs">
                        {i + 1}
                      </span>
                      Tool #{i + 1}
                    </h3>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Tool */}
                    <Field label="AI Tool">
                      <Select
                        value={row.tool}
                        onValueChange={(v) =>
                          updateRow(i, { tool: v, plan: "", seats: 1, spend: null })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tool" />
                        </SelectTrigger>
                        <SelectContent>
                          {TOOLS.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    {/* Plan */}
                    <Field label="Current Plan">
                      <Select
                        value={row.plan}
                        disabled={!row.tool}
                        onValueChange={(v) => updateRow(i, { plan: v })}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={row.tool ? "Select plan" : "Select a tool first"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((p) => (
                            <SelectItem key={p.name} value={p.name}>
                              {p.name}
                              {p.price !== null
                                ? ` — $${p.price}${p.perSeat ? "/seat" : ""}/mo`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    {/* Seats — per-seat plans only */}
                    {isPerSeat && (
                      <Field label="Team Seats">
                        <Input
                          type="number"
                          min={1}
                          value={row.seats}
                          onChange={(e) =>
                            updateRow(i, {
                              seats: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          placeholder="e.g. 8"
                        />
                      </Field>
                    )}

                    {/* Monthly Spend (read-only, computed) */}
                    <Field label="Monthly Spend (USD)">
                      <Input
                        readOnly
                        value={
                          row.spend !== null
                            ? `$${row.spend.toLocaleString()}`
                            : row.plan
                              ? "Usage-based"
                              : ""
                        }
                        placeholder="Select a plan"
                        className="text-foreground font-medium"
                      />
                    </Field>
                  </div>

                  {/* Plan notes */}
                  {selectedPlan?.notes && (
                    <p className="mt-3 text-xs text-muted-foreground italic">
                      ℹ {selectedPlan.notes}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Add tool */}
            <button
              type="button"
              onClick={addRow}
              className="w-full glass rounded-2xl py-5 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors border-dashed"
            >
              <Plus className="h-4 w-4" />
              Add another tool
            </button>

            {/* Team info */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-5">About your team</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Work Email">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@company.com"
                  />
                </Field>

                <Field label="Company">
                  <Input
                    value={company}
                    onChange={(e) =>
                      setCompany(e.target.value)
                    }
                    placeholder="Acme Inc."
                  />
                </Field>

                <Field label="Role">
                  <Input
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value)
                    }
                    placeholder="Engineering Manager"
                  />
                </Field>
                <Field label="Total Team Size">
                  <Input
                    type="number"
                    min={1}
                    value={teamSize}
                    onChange={(e) =>
                      setTeamSize(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    placeholder="e.g. 24"
                  />
                </Field>

                <Field label="Primary Use Case">
                  <div className="grid grid-cols-4 gap-1.5 p-1 rounded-lg bg-muted/40 border border-border">
                    {USE_CASES.map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => setUseCase(u.id)}
                        className={`text-xs py-2 rounded-md transition-all ${useCase === u.id
                          ? "bg-gradient-brand text-primary-foreground shadow-glow"
                          : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="lg:sticky lg:top-24 h-fit space-y-4">
            <div className="glass-strong glow-border rounded-2xl p-6">
              {/* Auto-save indicator */}
              <div className="flex items-center gap-2 text-xs text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Auto-saving
              </div>

              {/* Annual spend — from live audit */}
              <p className="mt-4 text-xs text-muted-foreground uppercase tracking-wider">
                Estimated annual spend
              </p>
              <p className="mt-1 text-4xl font-semibold tracking-tight">
                ${liveAudit.totalAnnual.toLocaleString()}
              </p>

              {/* Optimization score */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-brand transition-all duration-700"
                    style={{ width: `${liveAudit.score}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {liveAudit.score}/100
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Optimization score</p>

              {/* Savings — from live audit engine, not a heuristic */}
              <div className="mt-6 p-4 rounded-xl bg-success/10 border border-success/20">
                <p className="text-xs text-success uppercase tracking-wider">
                  Potential savings
                </p>
                <p className="mt-1 text-2xl font-semibold text-success">
                  ${liveAudit.savingsAnnual.toLocaleString()}/yr
                </p>
                {liveAudit.recommendations.length > 0 && (
                  <p className="mt-1 text-xs text-success/70">
                    {liveAudit.recommendations.length} issue
                    {liveAudit.recommendations.length !== 1 ? "s" : ""} found
                  </p>
                )}
              </div>

              {/* Feature list */}
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5" />
                  Plan-tier optimization
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5" />
                  Seat right-sizing
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5" />
                  Tool consolidation
                </li>
              </ul>

              {/* Generate */}
              <Button
                className="w-full mt-6 animate-glow-pulse"
                disabled={loading || !rows.some((r) => r.tool && r.plan)}
                onClick={handleGenerate}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Audit
                  </>
                )}
              </Button>

              <Link
                to="/"
                className="block mt-3 text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Back to home
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AuditForm;

/* ─────────────────────────────────────── */
/* Field wrapper                           */
/* ─────────────────────────────────────── */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}