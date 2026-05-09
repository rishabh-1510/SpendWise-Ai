import { Label } from "@/components/ui/label";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Sparkles,
  Check,
} from "lucide-react";

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

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  auditSchema,
  type AuditFormData,
} from "@/types/auditSchema";

import { runAudit } from "@/utils/auditEngine";
import { pricingData } from "@/data/pricing";

/* -------------------------------- */
/* Dynamic Data */
/* -------------------------------- */

const TOOLS = pricingData.map(
  (tool) => tool.tool
);

const getPlansForTool = (
  toolName: string
) => {
  const tool = pricingData.find(
    (t) => t.tool === toolName
  );

  return tool?.plans || [];
};

/* -------------------------------- */
/* Use Cases */
/* -------------------------------- */

const USE_CASES = [
  { id: "coding", label: "Coding" },
  { id: "writing", label: "Writing" },
  { id: "research", label: "Research" },
  { id: "mixed", label: "Mixed" },
];

/* -------------------------------- */
/* Types */
/* -------------------------------- */

type Row = {
  tool: string;
  plan: string;
  spend: string;
  seats: string;
};

const empty: Row = {
  tool: "",
  plan: "",
  spend: "",
  seats: "1",
};

/* -------------------------------- */
/* Component */
/* -------------------------------- */

const AuditForm = () => {
  const { register, watch } =
    useForm<AuditFormData>({
      resolver: zodResolver(auditSchema),

      defaultValues:
        JSON.parse(
          localStorage.getItem(
            "audit-form"
          ) || "null"
        ) || {
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

  const [rows, setRows] = useState<Row[]>(
    [{ ...empty }]
  );

  const [useCase, setUseCase] =
    useState("coding");

  /* -------------------------------- */
  /* Calculations */
  /* -------------------------------- */

  const total = useMemo(
    () =>
      rows.reduce(
        (s, r) =>
          s +
          (parseFloat(r.spend) || 0),
        0
      ),
    [rows]
  );

  const annual = total * 12;

  const estSavings = Math.round(
    annual * 0.28
  );

  /* -------------------------------- */
  /* Update Row */
  /* -------------------------------- */

  const update = (
    i: number,
    patch: Partial<Row>
  ) =>
    setRows((r) =>
      r.map((row, idx) =>
        idx === i
          ? { ...row, ...patch }
          : row
      )
    );

  /* -------------------------------- */
  /* Render */
  /* -------------------------------- */

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
            <span className="text-gradient-brand">
              AI stack
            </span>
          </h1>

          <p className="mt-3 text-muted-foreground max-w-xl">
            Add the tools your team
            pays for. We'll find
            inefficiencies, plan
            mismatches, and optimization
            opportunities.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* -------------------------------- */}
          {/* Form */}
          {/* -------------------------------- */}

          <div className="space-y-6">
            {rows.map((row, i) => (
              <div
                key={i}
                className="glass glow-border rounded-2xl p-6 animate-fade-up"
              >
                {/* Header */}
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
                      onClick={() =>
                        setRows((r) =>
                          r.filter(
                            (_, idx) =>
                              idx !== i
                          )
                        )
                      }
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
                        update(i, {
                          tool: v,
                          plan: "",
                          spend: "",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tool" />
                      </SelectTrigger>

                      <SelectContent>
                        {TOOLS.map((t) => (
                          <SelectItem
                            key={t}
                            value={t}
                          >
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {/* Plan */}
                  <Field label="Current Plan">
                    <Select
                      value={row.plan}
                      onValueChange={(v) => {
                        const selectedPlan =
                          getPlansForTool(
                            row.tool
                          ).find(
                            (p) =>
                              p.name === v
                          );

                        const monthlyPrice =
                          (selectedPlan?.price ||
                            0) *
                          Number(
                            row.seats || 1
                          );

                        update(i, {
                          plan: v,
                          spend:
                            String(
                              monthlyPrice
                            ),
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>

                      <SelectContent>
                        {getPlansForTool(
                          row.tool
                        ).map((plan) => (
                          <SelectItem
                            key={plan.name}
                            value={plan.name}
                          >
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  {/* Spend */}
                  <Field label="Monthly Spend (USD)">
                    <Input
                      type="number"
                      value={row.spend}
                      readOnly
                    />
                  </Field>

                  {/* Seats */}
                  <Field label="Team Seats">
                    <Input
                      type="number"
                      value={row.seats}
                      onChange={(e) => {
                        const seats =
                          e.target.value;

                        const selectedPlan =
                          getPlansForTool(
                            row.tool
                          ).find(
                            (p) =>
                              p.name ===
                              row.plan
                          );

                        const monthlyPrice =
                          (selectedPlan?.price ||
                            0) *
                          Number(
                            seats || 1
                          );

                        update(i, {
                          seats,
                          spend:
                            String(
                              monthlyPrice
                            ),
                        });
                      }}
                      placeholder="8"
                    />
                  </Field>
                </div>
              </div>
            ))}

            {/* Add Tool */}
            <button
              type="button"
              onClick={() =>
                setRows((r) => [
                  ...r,
                  { ...empty },
                ])
              }
              className="w-full glass rounded-2xl py-5 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors border-dashed"
            >
              <Plus className="h-4 w-4" />
              Add another tool
            </button>

            {/* Team Info */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-5">
                About your team
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Team Size */}
                <Field label="Total Team Size">
                  <Input
                    type="number"
                    {...register(
                      "teamSize",
                      {
                        valueAsNumber: true,
                      }
                    )}
                  />
                </Field>

                {/* Use Case */}
                <Field label="Primary Use Case">
                  <div className="grid grid-cols-4 gap-1.5 p-1 rounded-lg bg-muted/40 border border-border">
                    {USE_CASES.map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => {
                          setUseCase(
                            u.id
                          );

                          localStorage.setItem(
                            "selected-use-case",
                            u.id
                          );
                        }}
                        className={`text-xs py-2 rounded-md transition-all ${
                          useCase === u.id
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

          {/* -------------------------------- */}
          {/* Sidebar */}
          {/* -------------------------------- */}

          <aside className="lg:sticky lg:top-24 h-fit space-y-4">
            <div className="glass-strong glow-border rounded-2xl p-6">
              <div className="flex items-center gap-2 text-xs text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Auto-saving
              </div>

              <p className="mt-4 text-xs text-muted-foreground uppercase tracking-wider">
                Estimated annual spend
              </p>

              <p className="mt-1 text-4xl font-semibold tracking-tight">
                $
                {annual.toLocaleString()}
              </p>

              <div className="mt-6 p-4 rounded-xl bg-success/10 border border-success/20">
                <p className="text-xs text-success uppercase tracking-wider">
                  Potential savings
                </p>

                <p className="mt-1 text-2xl font-semibold text-success">
                  $
                  {estSavings.toLocaleString()}
                  /yr
                </p>
              </div>

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
                onClick={() => {
                  const result =
                    runAudit(rows);

                  localStorage.setItem(
                    "audit-results",
                    JSON.stringify(
                      result
                    )
                  );

                  nav("/report/sample");
                }}
              >
                <Sparkles className="h-4 w-4" />
                Generate Audit
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

/* -------------------------------- */
/* Reusable Field */
/* -------------------------------- */

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