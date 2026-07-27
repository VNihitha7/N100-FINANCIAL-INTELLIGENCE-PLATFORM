import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { companies, tickerMap } from "@/data";
import { AppShell } from "@/components/app-shell";
import { Panel, Badge } from "@/components/ui-bits";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Trend Analysis · Nifty 100 Analyst Terminal" },
      { name: "description", content: "Overlay up to three KPI trends across a decade for any Nifty 100 company." },
      { property: "og:title", content: "KPI Trend Analysis · Nifty 100" },
      { property: "og:description", content: "Multi-metric long-term trend overlay for any Nifty 100 company." },
    ],
  }),
  component: Trends,
});

const METRICS = [
  { key: "sales", label: "Sales (Cr)", color: "#f0b90b" },
  { key: "np", label: "Net Profit (Cr)", color: "#00d4aa" },
  { key: "roe", label: "ROE %", color: "#7aa2f7" },
  { key: "roce", label: "ROCE %", color: "#c678dd" },
  { key: "opm", label: "OPM %", color: "#e5c07b" },
  { key: "de", label: "D/E", color: "#e06c75" },
  { key: "fcf", label: "FCF (Cr)", color: "#56b6c2" },
  { key: "eps", label: "EPS", color: "#d19a66" },
] as const;

function Trends() {
  const [ticker, setTicker] = useState(companies[0].ticker);
  const [selected, setSelected] = useState<string[]>(["sales", "np", "roe"]);
  const c = tickerMap.get(ticker)!;

  const toggle = (k: string) =>
    setSelected((s) => s.includes(k) ? s.filter((x) => x !== k) : (s.length < 3 ? [...s, k] : [...s.slice(1), k]));

  const data = useMemo(() => c.history, [c]);

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="term-label">MODULE · TREND ANALYSIS</div>
            <h1 className="text-xl font-semibold mt-1">Multi-metric Overlay</h1>
          </div>
          <select value={ticker} onChange={(e) => setTicker(e.target.value)}
            className="ml-auto bg-panel border border-grid px-3 py-1.5 text-[12px]">
            {companies.map((c) => <option key={c.ticker} value={c.ticker}>{c.ticker} — {c.name}</option>)}
          </select>
          <Badge tone="amber">MAX 3 METRICS</Badge>
        </div>

        <Panel title={`${c.ticker} · ${c.name}`}>
          <div className="border-b border-grid px-3 py-2 flex flex-wrap gap-1.5">
            {METRICS.map((m) => (
              <button key={m.key} onClick={() => toggle(m.key)}
                className={`px-2 py-1 text-[10px] tracking-wider uppercase border rounded-sm flex items-center gap-1.5 ${
                  selected.includes(m.key) ? "border-amber text-amber bg-accent" : "border-grid text-muted-foreground hover:text-foreground"
                }`}>
                <span className="h-2 w-2 rounded-sm" style={{ background: m.color }} />
                {m.label}
              </button>
            ))}
          </div>
          <div className="h-[28rem] p-2">
            <ResponsiveContainer>
              <LineChart data={data}>
                <CartesianGrid stroke="#2a3140" strokeDasharray="2 2" />
                <XAxis dataKey="y" tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false} />
                <YAxis tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false} />
                <Tooltip contentStyle={{ background: "#151b23", border: "1px solid #2a3140", fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {selected.map((k) => {
                  const m = METRICS.find((x) => x.key === k)!;
                  return <Line key={k} dataKey={k} name={m.label} stroke={m.color} strokeWidth={2} dot={false} />;
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
