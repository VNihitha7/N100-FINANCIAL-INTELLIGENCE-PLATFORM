import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { companies, sectorStats, fmt } from "@/data";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, Badge } from "@/components/ui-bits";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home · Nifty 100 Analyst Terminal" },
      { name: "description", content: "Universe overview: 92 Nifty 100 companies with median ROE, D/E, P/E, top composite quality scores and sector breakdown." },
      { property: "og:title", content: "Nifty 100 Analyst Terminal · Home" },
      { property: "og:description", content: "Universe overview across 92 Nifty 100 companies with composite scores and sector breakdown." },
    ],
  }),
  component: Home,
});

const median = (xs: (number | null)[]) => {
  const s = xs.filter((x): x is number => x != null).sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};

const PIE_COLORS = ["#f0b90b","#00d4aa","#7aa2f7","#e06c75","#c678dd","#e5c07b","#56b6c2","#98c379","#d19a66","#61afef","#c9a86a"];

function Home() {
  const stats = useMemo(() => {
    const roe = median(companies.map((c) => c.latest.roe_pct as number | null));
    const de = median(companies.map((c) => c.latest.de as number | null));
    const pe = median(companies.map((c) => c.pe_current));
    const revCagr = median(companies.map((c) => c.cagr.sales_cagr_5yr as number | null));
    const debtFree = companies.filter((c) => c.latest.de === 0).length;
    return { roe, de, pe, revCagr, debtFree };
  }, []);

  const top = useMemo(
    () => [...companies].sort((a, b) => (b.composite_score ?? 0) - (a.composite_score ?? 0)).slice(0, 8),
    []
  );

  const secData = useMemo(
    () => Object.entries(sectorStats)
      .map(([name, s]) => ({ name, value: s.count }))
      .sort((a, b) => b.value - a.value),
    []
  );

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="term-label">MODULE · HOME</div>
            <h1 className="text-xl font-semibold mt-1">Universe Overview</h1>
          </div>
          <div className="flex gap-2">
            <Badge tone="teal">DQ · 16/16 PASS</Badge>
            <Badge tone="amber">DB · 10 TABLES</Badge>
            <Badge>K-MEANS · 5 CLUSTERS</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiTile label="Companies" value={String(companies.length)} tone="amber" />
          <KpiTile label="Median ROE" value={fmt.pct(stats.roe)} tone="teal" />
          <KpiTile label="Median D/E" value={fmt.num(stats.de)} />
          <KpiTile label="Median P/E" value={fmt.num(stats.pe)} />
          <KpiTile label="5Y Rev CAGR (med)" value={fmt.pct(stats.revCagr)} tone="teal" />
          <KpiTile label="Debt-Free" value={String(stats.debtFree)} tone="amber" sub="D/E = 0 latest year" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title="Sector Composition" className="lg:col-span-1">
            <div className="h-72 p-2">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={secData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={1}>
                    {secData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#151b23", border: "1px solid #2a3140", fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="border-t border-grid px-3 py-2 text-[11px] grid grid-cols-2 gap-x-3 gap-y-1">
              {secData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="tabular-nums text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Top Composite Quality Score" className="lg:col-span-2">
            <div className="h-72 p-2">
              <ResponsiveContainer>
                <BarChart data={top} margin={{ top: 6, right: 12, bottom: 24, left: 0 }}>
                  <XAxis dataKey="ticker" tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false} />
                  <YAxis tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#151b23", border: "1px solid #2a3140", fontSize: 11 }} />
                  <Bar dataKey="composite_score" fill="#f0b90b" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="border-t border-grid divide-y divide-[color:var(--grid)]">
              {top.map((c, i) => (
                <Link to="/company/$ticker" params={{ ticker: c.ticker }} key={c.ticker}
                  className="flex items-center gap-3 px-3 py-1.5 text-[12px] hover:bg-secondary">
                  <span className="text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                  <span className="text-amber font-medium w-24">{c.ticker}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-muted-foreground w-32 truncate">{c.broad_sector}</span>
                  <span className="text-teal tabular-nums w-14 text-right">{fmt.num(c.composite_score, 1)}</span>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Directory · 92 Companies" right={<div className="text-[10px] text-muted-foreground">Click a row to open profile</div>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-[color:var(--grid)]">
            {[...companies].sort((a,b)=>a.ticker.localeCompare(b.ticker)).map((c) => (
              <Link key={c.ticker} to="/company/$ticker" params={{ ticker: c.ticker }}
                className="bg-panel px-3 py-2 hover:bg-secondary flex items-center gap-2 text-[12px]">
                <span className="text-amber font-medium w-20 shrink-0">{c.ticker}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="tabular-nums text-muted-foreground">{fmt.num(c.composite_score, 0)}</span>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
