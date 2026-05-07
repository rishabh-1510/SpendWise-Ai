import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { TrendingDown, Sparkles, ArrowUpRight } from "lucide-react";

const data = [
  { m: "Jan", v: 820 }, { m: "Feb", v: 940 }, { m: "Mar", v: 1120 },
  { m: "Apr", v: 1380 }, { m: "May", v: 1520 }, { m: "Jun", v: 1610 },
  { m: "Jul", v: 1340 }, { m: "Aug", v: 1180 }, { m: "Sep", v: 980 },
];

export function DashboardPreview() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="absolute -inset-4 bg-gradient-brand opacity-20 blur-3xl rounded-3xl" />
      <div className="relative glass-strong glow-border rounded-2xl p-4 shadow-elegant animate-fade-up">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-destructive/70" />
            <span className="h-3 w-3 rounded-full bg-chart-4/70" />
            <span className="h-3 w-3 rounded-full bg-success/70" />
          </div>
          <div className="text-xs text-muted-foreground font-mono">app.spendwise.ai/dashboard</div>
          <div className="w-12" />
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-3">
          <Stat label="Annual Savings" value="$14,280" icon={TrendingDown} accent="success" />
          <Stat label="Tools Audited" value="12" icon={Sparkles} />
          <Stat label="Optimization Score" value="92/100" icon={ArrowUpRight} accent="primary" />
          <div className="md:col-span-3 glass rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="text-sm text-muted-foreground">AI Spend Trend</div>
                <div className="text-xl font-semibold">$9,847 / year</div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">−18% MoM</span>
            </div>
            <div className="h-44">
              <ResponsiveContainer>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.65 0.22 270)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.65 0.22 270)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" stroke="oklch(0.6 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.6 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.025 270)", border: "1px solid oklch(0.28 0.03 265)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="v" stroke="oklch(0.7 0.22 280)" strokeWidth={2} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function Stat({ label, value, icon: Icon, accent }: { label: string; value: string; icon: any; accent?: "success" | "primary" }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent === "success" ? "text-success" : accent === "primary" ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className={`mt-2 text-2xl font-semibold ${accent === "success" ? "text-success" : ""}`}>{value}</div>
    </div>
  );
}