import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Building2,
  Filter,
  Layers,
  LineChart,
  Map,
  Radar,
  ScrollText,
  Signal,
  TrendingUp,
} from "lucide-react";
import { companies } from "@/data";

const NAV = [
  { to: "/", label: "Home", icon: Activity, code: "HOME" },
  { to: "/screener", label: "Screener", icon: Filter, code: "SCR" },
  { to: "/peers", label: "Peer Groups", icon: Radar, code: "PEER" },
  { to: "/trends", label: "Trend Analysis", icon: LineChart, code: "TRND" },
  { to: "/sectors", label: "Sectors", icon: Building2, code: "SEC" },
  { to: "/capital", label: "Capital Allocation", icon: Map, code: "CAP" },
  { to: "/valuation", label: "Valuation", icon: TrendingUp, code: "VAL" },
  { to: "/reports", label: "Annual Reports", icon: ScrollText, code: "RPT" },
  { to: "/clusters", label: "Clusters", icon: Layers, code: "CLU" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top status bar */}
      <header className="h-9 border-b border-grid bg-panel flex items-center px-3 gap-4 text-[11px] tracking-wider">
        <div className="flex items-center gap-2">
          <Signal className="h-3.5 w-3.5 text-amber" />
          <span className="text-amber font-semibold">NIFTY 100 · ANALYST TERMINAL</span>
        </div>
        <div className="text-muted-foreground">v1.0 · SPRINT 1–6 COMPLETE</div>
        <div className="ml-auto flex items-center gap-4 text-muted-foreground">
          <span>UNIVERSE: <span className="text-teal">{companies.length}</span></span>
          <span>SESSION: <span className="text-foreground">{now} IST</span></span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.78_0.14_175)] animate-pulse" />
            <span>LIVE</span>
          </span>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-grid bg-[color:var(--sidebar)] flex flex-col">
          <div className="px-3 py-4 border-b border-grid">
            <div className="term-label">Navigation</div>
          </div>
          <nav className="flex-1 py-2">
            {NAV.map((n) => {
              const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2.5 px-3 py-2 text-[13px] border-l-2 transition-colors ${
                    active
                      ? "border-amber bg-accent text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="flex-1">{n.label}</span>
                  <span className="text-[9px] tracking-widest text-muted-foreground">{n.code}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-grid p-3 text-[10px] text-muted-foreground">
            <div>DB · nifty100.db</div>
            <div>ROWS · 10 tables loaded</div>
            <div className="mt-1 text-teal">DQ · 0 CRITICAL</div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-x-auto">
          {children}
        </main>
      </div>

      {/* Bottom ticker */}
      <footer className="h-6 border-t border-grid bg-panel flex items-center px-3 text-[10px] tracking-wider text-muted-foreground">
        <BarChart3 className="h-3 w-3 mr-2 text-amber" />
        <span>FN:F1 HELP · F2 SCREENER · F3 PEERS · F4 SECTORS · F8 EXPORT</span>
        <span className="ml-auto">© Analyst Terminal · Data as of latest available fiscal year</span>
      </footer>
    </div>
  );
}
