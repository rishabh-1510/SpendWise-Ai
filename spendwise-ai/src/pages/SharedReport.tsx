import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function SharedReport() {
  const data = JSON.parse(
    localStorage.getItem("audit-results") || "{}"
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/60 sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>

            <span className="font-semibold text-sm">
              SpendWise{" "}
              <span className="text-gradient-brand">
                AI
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-muted-foreground">
              Read-only public report
            </span>

            <Link to="/audit">
              <Button
                size="sm"
                className="bg-gradient-brand text-white shadow-glow"
              >
                Run your own audit
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Report */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="glass glow-border rounded-3xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                AI Spend Audit Report
              </p>

              <h1 className="mt-2 text-4xl font-bold">
                Optimization Score:{" "}
                <span className="text-gradient-brand">
                  {data.score || 0}/100
                </span>
              </h1>
            </div>

            <div className="rounded-2xl bg-success/10 border border-success/20 px-5 py-4">
              <p className="text-xs uppercase text-success tracking-wider">
                Estimated Savings
              </p>

              <p className="mt-1 text-3xl font-bold text-success">
                ${data.savings || 0}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-5">
              Recommendations
            </h2>

            <div className="space-y-4">
              {data.recommendations?.map(
                (r: string, i: number) => (
                  <div
                    key={i}
                    className="glass rounded-xl p-4 border border-border/50"
                  >
                    {r}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="glass rounded-2xl p-8 text-center mt-10">
          <h3 className="text-2xl font-semibold">
            Curious about your team's AI spend?
          </h3>

          <p className="mt-2 text-muted-foreground">
            Generate your own audit in under 60
            seconds — free, no signup.
          </p>

          <Link
            to="/audit"
            className="inline-block mt-5"
          >
            <Button
              size="lg"
              className="bg-gradient-brand text-white shadow-glow"
            >
              Start free audit
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default SharedReport;