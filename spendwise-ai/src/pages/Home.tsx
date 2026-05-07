import { Footer } from "@/components/shared/Footer"
import { Navbar } from "@/components/shared/Navbar"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight , Check } from "lucide-react"
import { DashboardPreview } from "@/components/homepage/DashboardPreview"

const Home = () => {
  return (
    <div className="min-h-screen">
        <Navbar/>
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
              <Button  className="group">
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
        <Footer/>
    </div>
  )
}

export default Home