import { Footer } from "@/components/shared/Footer"
import { Navbar } from "@/components/shared/Navbar"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { BarChart3, Sparkles, Users, Share2, ArrowRight, Check, Star } from "lucide-react"
import { DashboardPreview } from "@/components/homepage/DashboardPreview"

const features = [
  { icon: BarChart3, title: "AI Spend Analysis", desc: "Connect or upload your AI subscriptions and get a complete breakdown of where every dollar goes." },
  { icon: Sparkles, title: "Savings Recommendations", desc: "Personalized plan switches and tool consolidations powered by usage patterns." },
  { icon: Users, title: "Team Cost Optimization", desc: "Identify unused seats, overlapping tools, and right-size plans across your org." },
  { icon: Share2, title: "Shareable Reports", desc: "Beautiful public reports for finance, leadership, or your engineering team." },
];

const Home = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 grid-bg" />
        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            New · Multi-tool consolidation engine
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight animate-fade-up">
            Stop Overspending<br />on <span className="text-gradient-brand">AI Tools</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-up">
            Analyze your ChatGPT, Claude, Cursor, and Copilot spending in seconds. Discover savings the moment you finish the audit.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up">
            <Link to="/audit">
              <Button className="group">
                Audit My AI Spend
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/report/sample">
              <Button >View Sample Report</Button>
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-success" /> No credit card</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-success" /> 60-second audit</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-success" /> Free forever</span>
          </div>

          <div className="mt-20">
            <DashboardPreview />
          </div>
        </div>
      </section>
      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">Everything you need to <span className="text-gradient-brand">control AI spend</span></h2>
          <p className="mt-4 text-muted-foreground text-lg">Built for finance leaders, engineering managers, and operators who refuse to overpay.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="glass glow-border rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300 group">
              <div className="h-11 w-11 rounded-xl bg-gradient-brand/20 flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl glass-strong p-12 md:p-16 text-center">
          <div className="absolute inset-0 bg-gradient-hero opacity-60" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">Find your savings in 60 seconds</h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">Free, instant, and surprisingly insightful. No credit card required.</p>
            <Link to="/audit" className="inline-block mt-8">
              <Button className="w-lg h-8 text-lg ">Start free audit <ArrowRight className="h-6 w-6" /></Button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Home