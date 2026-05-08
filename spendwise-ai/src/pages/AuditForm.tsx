import { Label } from "@/components/ui/label";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, Sparkles, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { auditSchema, type AuditFormData } from "@/types/auditSchema";

const TOOLS = ["ChatGPT", "Claude", "Cursor", "GitHub Copilot", "Perplexity", "Midjourney", "Notion AI"];
const PLANS = ["Free", "Plus / Pro", "Team", "Business", "Enterprise"];

const USE_CASES = [
  { id: "coding", label: "Coding" },
  { id: "writing", label: "Writing" },
  { id: "research", label: "Research" },
  { id: "mixed", label: "Mixed" },
];

type Row = { tool: string; plan: string; spend: string; seats: string };
const empty: Row = { tool: "", plan: "", spend: "", seats: "1" };

const AuditForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AuditFormData>({
    resolver: zodResolver(auditSchema),
    defaultValues:
      JSON.parse(localStorage.getItem("audit-form") || "null") || {
        tool: "",
        plan: "",
        monthlySpend: 0,
        seats: 1,
        teamSize: 1,
        useCase: "coding",
      },
  });
  const formValues = watch();
  useEffect(() => {
    localStorage.setItem(
      "audit-form",
      JSON.stringify(formValues)
    );
  }, [formValues]);
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([{ ...empty, tool: "ChatGPT", plan: "Team", spend: "240", seats: "8" }]);
  const [useCase, setUseCase] = useState("coding");
  const total = useMemo(() => rows.reduce((s, r) => s + (parseFloat(r.spend) || 0), 0), [rows]);
  const annual = total * 12;
  const estSavings = Math.round(annual * 0.28);
  const update = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Step 1 of 1</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">Tell us about your <span className="text-gradient-brand">AI stack</span></h1>
          <p className="mt-3 text-muted-foreground max-w-xl">Add the tools your team pays for. We'll find inefficiencies, plan mismatches, and optimization opportunities.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Form */}
          <div className="space-y-6">
            {rows.map((row, i) => (
              <div key={i} className="glass glow-border rounded-2xl p-6 animate-fade-up">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold flex items-center gap-2">
                    <span className="h-6 w-6 rounded-md bg-gradient-brand flex items-center justify-center text-xs">{i + 1}</span>
                    Tool #{i + 1}
                  </h3>
                  {rows.length > 1 && (
                    <button onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="AI Tool">
                    <Select value={row.tool} onValueChange={(v) => update(i, { tool: v })}>
                      <SelectTrigger><SelectValue placeholder="Select tool" /></SelectTrigger>
                      <SelectContent>{TOOLS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Current Plan">
                    <Select value={row.plan} onValueChange={(v) => update(i, { plan: v })}>
                      <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                      <SelectContent>{PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Monthly Spend (USD)">
                    <Input type="number" value={row.spend} onChange={(e) => update(i, { spend: e.target.value })} placeholder="240" />
                  </Field>
                  <Field label="Team Seats">
                    <Input type="number" value={row.seats} onChange={(e) => update(i, { seats: e.target.value })} placeholder="8" />
                  </Field>
                </div>
              </div>
            ))}

            <button
              onClick={() => setRows((r) => [...r, { ...empty }])}
              className="w-full glass rounded-2xl py-5 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors border-dashed"
            >
              <Plus className="h-4 w-4" /> Add another tool
            </button>

            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-5">About your team</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Total Team Size">
                  <Input
                    type="number"
                    {...register("teamSize")}
                  />
                </Field>
                <Field label="Primary Use Case">
                  <div className="grid grid-cols-4 gap-1.5 p-1 rounded-lg bg-muted/40 border border-border">
                    {USE_CASES.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setUseCase(u.id);
                          localStorage.setItem(
                            "selected-use-case",
                            u.id
                          );
                        }}
                        className={`text-xs py-2 rounded-md transition-all ${useCase === u.id ? "bg-gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit space-y-4">
            <div className="glass-strong glow-border rounded-2xl p-6">
              <div className="flex items-center gap-2 text-xs text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Auto-saving
              </div>
              <p className="mt-4 text-xs text-muted-foreground uppercase tracking-wider">Estimated annual spend</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight">${annual.toLocaleString()}</p>
              <div className="mt-6 p-4 rounded-xl bg-success/10 border border-success/20">
                <p className="text-xs text-success uppercase tracking-wider">Potential savings</p>
                <p className="mt-1 text-2xl font-semibold text-success">${estSavings.toLocaleString()}/yr</p>
              </div>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><Check className="h-4 w-4 text-success mt-0.5" /> Plan-tier optimization</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-success mt-0.5" /> Seat right-sizing</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-success mt-0.5" /> Tool consolidation</li>
              </ul>
              <Button className="w-full mt-6 animate-glow-pulse" onClick={() => nav("/report/sample")}>
                <Sparkles className="h-4 w-4" /> Generate Audit
              </Button>
              <Link to="/" className="block mt-3 text-center text-xs text-muted-foreground hover:text-foreground">Back to home</Link>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default AuditForm


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}