import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Sparkles } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="absolute inset-0 backdrop-blur-xl bg-background/60 border-b border-border/50" />
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand shadow-glow group-hover:scale-110 transition-transform">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg tracking-tight">SpendWise<span className="text-gradient-brand"> AI</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="/#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="/#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
          <a href="/#faq" className="hover:text-foreground transition-colors">FAQ</a>
          <Link to="/report/sample" className="hover:text-foreground transition-colors">Sample Report</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/audit" className="hidden sm:block">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/audit">
            <Button variant="outline" className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-purple-500/30" size="sm">Start audit</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}