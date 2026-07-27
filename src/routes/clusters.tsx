import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { companies, fmt } from "@/data";
import { AppShell } from "@/components/app-shell";
import { Panel, Badge } from "@/components/ui-bits";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/clusters")({
  head: () => ({
    meta: [
      { title: "Clusters · Nifty 100 Analyst Terminal" },
      { name: "description", content: "K-Means (k=5) clustering of Nifty 100 companies by ROE, D/E, growth and margins — with archetype labels." },
      { property: "og:title", content: "Cluster Analysis · Nifty 100" },
      { property: "og:description", content: "5-cluster K-Means archetypes across the Nifty 100." },
    ],
  }),
  component: Clusters,
});

const COLORS = ["#f0b90b","#00d4aa","#7aa2f7","#e06c75","#c678dd"];

function Clusters() {
  const clusters = useMemo(() => {
    const map = new Map<string, typeof companies>();
    companies.forEach((c) => {
      const k = c.cluster ?? "Unclassified";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    });
    return [...map.entries()];
  }, []);

  const [active, setActive] = useState<string | null>(clusters[0]?.[0] ?? null);
  const points = companies.map((c) => ({
    x: (c.latest.roe_pct as number | null) ?? 0,
    y: (c.latest.de as number | null) ?? 0,
    z: (c.composite_score ?? 50) * 3,
    ticker: c.ticker, name: c.name, cluster: c.cluster,
  }));

  const perCluster = clusters.map(([name, list], i) => ({
    name, count: list.length, color: COLORS[i % COLORS.length],
    avgROE: list.reduce((a, c) => a + ((c.latest.roe_pct as number) || 0), 0) / list.length,
    avgDE: list.reduce((a, c) => a + ((c.latest.de as number) || 0), 0) / list.length,
    avgScore: list.reduce((a, c) => a + (c.composite_score ?? 0), 0) / list.length,
  }));

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="term-label">MODULE · CLUSTERS</div>
            <h1 className="text-xl font-semibold mt-1">K-Means Archetypes · k=5</h1>
          </div>
          <Badge tone="amber">FEATURES · ROE, D/E, REV G, PAT G, OPM</Badge>
          <Badge tone="teal">STANDARD SCALER · RANDOM_STATE=42</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {perCluster.map((c, i) => (
            <button key={c.name} onClick={() => setActive(active === c.name ? null : c.name)}
              className={`term-panel p-3 text-left ${active === c.name ? "outline outline-1 outline-amber" : ""}`}
              style={{ background: `linear-gradient(135deg, ${c.color}22, transparent)`, borderColor: c.color + "60" }}>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />
                <span className="text-[10px] tracking-wider uppercase">C{i}</span>
              </div>
              <div className="text-[13px] font-medium mt-1">{c.name}</div>
              <div className="text-2xl font-bold tabular-nums mt-1" style={{ color: c.color }}>{c.count}</div>
              <div className="text-[10px] text-muted-foreground mt-1">
                ROE {fmt.pct(c.avgROE, 0)} · D/E {fmt.num(c.avgDE, 1)} · Score {fmt.num(c.avgScore, 0)}
              </div>
            </button>
          ))}
        </div>

        <Panel title="ROE vs D/E · Cluster Scatter">
          <div className="h-96 p-2">
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 10 }}>
                <CartesianGrid stroke="#2a3140" strokeDasharray="2 2" />
                <XAxis type="number" dataKey="x" tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false}
                  label={{ value: "ROE %", fill: "#8b95a7", fontSize: 10, position: "insideBottom", offset: -10 }} />
                <YAxis type="number" dataKey="y" tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false}
                  label={{ value: "D/E", fill: "#8b95a7", fontSize: 10, angle: -90, position: "insideLeft" }} />
                <ZAxis type="number" dataKey="z" range={[40, 400]} />
                <Tooltip content={({ active, payload }: any) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload;
                  return (
                    <div className="term-panel p-2 text-[11px]">
                      <div className="text-amber">{p.ticker} · {p.name}</div>
                      <div className="text-muted-foreground">{p.cluster}</div>
                      <div>ROE {fmt.pct(p.x)} · D/E {fmt.num(p.y)}</div>
                    </div>
                  );
                }} />
                {clusters.map(([name], i) => (
                  <Scatter key={name} name={name} data={points.filter((p) => p.cluster === name)} fill={COLORS[i % 5]} fillOpacity={0.75} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {active && (
          <Panel title={`${active} · Members`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[color:var(--grid)]">
              {companies.filter((c) => c.cluster === active).sort((a,b) => (b.composite_score ?? 0) - (a.composite_score ?? 0)).map((c) => (
                <a key={c.ticker} href={`/company/${c.ticker}`} className="bg-panel px-3 py-2 hover:bg-secondary flex items-center gap-2 text-[12px]">
                  <span className="text-amber w-20">{c.ticker}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="tabular-nums text-teal">{fmt.num(c.composite_score, 0)}</span>
                </a>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </AppShell>
  );
}
