import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { companies, sectorStats, fmt, SECTORS } from "@/data";
import { AppShell } from "@/components/app-shell";
import { Panel, Badge, KpiTile } from "@/components/ui-bits";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export const Route = createFileRoute("/sectors")({
  head: () => ({
    meta: [
      { title: "Sectors · Nifty 100 Analyst Terminal" },
      { name: "description", content: "Sector-level analytics: bubble chart of Revenue vs ROE, sector median KPIs and constituent breakdowns." },
      { property: "og:title", content: "Sector Analysis · Nifty 100" },
      { property: "og:description", content: "Revenue vs ROE bubbles and sector median KPIs across 10 sectors." },
    ],
  }),
  component: Sectors,
});

function Sectors() {
  const [sector, setSector] = useState<string>(SECTORS[0]);
  const data = useMemo(
    () => companies.filter((c) => c.broad_sector === sector).map((c) => ({
      x: (c.latest.sales as number | null) ?? 0,
      y: (c.latest.roe_pct as number | null) ?? 0,
      z: Math.max(50, Math.min(1000, (c.index_weight_pct ?? 0.3) * 800)),
      ticker: c.ticker, name: c.name, sub: c.sub_sector,
    })),
    [sector]
  );

  const stats = sectorStats[sector];

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="term-label">MODULE · SECTORS</div>
            <h1 className="text-xl font-semibold mt-1">Sector Analysis</h1>
          </div>
          <select value={sector} onChange={(e) => setSector(e.target.value)}
            className="ml-auto bg-panel border border-grid px-3 py-1.5 text-[12px]">
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Badge tone="amber">{stats?.count ?? 0} COMPANIES</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="Median ROE" value={fmt.pct(stats?.median_roe)} tone="teal" />
          <KpiTile label="Median ROCE" value={fmt.pct(stats?.median_roce)} />
          <KpiTile label="Median D/E" value={fmt.num(stats?.median_de)} />
          <KpiTile label="Median P/E" value={fmt.num(stats?.median_pe)} tone="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title={`Revenue vs ROE · ${sector}`} className="lg:col-span-2">
            <div className="h-96 p-2">
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 10 }}>
                  <CartesianGrid stroke="#2a3140" strokeDasharray="2 2" />
                  <XAxis type="number" dataKey="x" name="Revenue (Cr)" tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false}
                    label={{ value: "Revenue (Cr)", fill: "#8b95a7", fontSize: 10, position: "insideBottom", offset: -10 }} />
                  <YAxis type="number" dataKey="y" name="ROE %" tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false}
                    label={{ value: "ROE %", fill: "#8b95a7", fontSize: 10, angle: -90, position: "insideLeft" }} />
                  <ZAxis type="number" dataKey="z" range={[40, 900]} />
                  <Tooltip contentStyle={{ background: "#151b23", border: "1px solid #2a3140", fontSize: 11 }}
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload;
                      return (
                        <div className="term-panel p-2 text-[11px]">
                          <div className="text-amber">{p.ticker} · {p.name}</div>
                          <div className="text-muted-foreground">{p.sub}</div>
                          <div>Rev: {fmt.cr(p.x)} · ROE: {fmt.pct(p.y)}</div>
                        </div>
                      );
                    }} />
                  <Scatter data={data} fill="#f0b90b" fillOpacity={0.7} stroke="#f0b90b" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Constituents">
            <div className="max-h-96 overflow-auto">
              {companies.filter((c) => c.broad_sector === sector)
                .sort((a, b) => (b.composite_score ?? 0) - (a.composite_score ?? 0))
                .map((c) => (
                  <a key={c.ticker} href={`/company/${c.ticker}`}
                    className="flex items-center gap-2 px-3 py-1.5 border-b border-grid hover:bg-secondary text-[12px]">
                    <span className="text-amber w-20 truncate">{c.ticker}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-teal tabular-nums w-12 text-right">{fmt.num(c.composite_score, 0)}</span>
                  </a>
                ))}
            </div>
          </Panel>
        </div>

        <Panel title="Sector KPI Medians · All Sectors">
          <div className="h-72 p-2">
            <ResponsiveContainer>
              <BarChart data={SECTORS.map((s) => ({
                sector: s,
                ROE: sectorStats[s]?.median_roe ?? 0,
                ROCE: sectorStats[s]?.median_roce ?? 0,
              }))} margin={{ bottom: 40 }}>
                <CartesianGrid stroke="#2a3140" strokeDasharray="2 2" />
                <XAxis dataKey="sector" tick={{ fill: "#8b95a7", fontSize: 9 }} axisLine={{ stroke: "#2a3140" }} tickLine={false} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false} />
                <Tooltip contentStyle={{ background: "#151b23", border: "1px solid #2a3140", fontSize: 11 }} />
                <Bar dataKey="ROE" fill="#f0b90b" />
                <Bar dataKey="ROCE" fill="#00d4aa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
