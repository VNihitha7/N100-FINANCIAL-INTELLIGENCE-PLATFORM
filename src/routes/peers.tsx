import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { peerGroups, peerPercentiles, tickerMap, fmt } from "@/data";
import { AppShell } from "@/components/app-shell";
import { Panel, Badge } from "@/components/ui-bits";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";

export const Route = createFileRoute("/peers")({
  head: () => ({
    meta: [
      { title: "Peer Groups · Nifty 100 Analyst Terminal" },
      { name: "description", content: "11 peer groups with percentile rankings across 9 KPIs and radar comparison of every company against its peer group average." },
      { property: "og:title", content: "Peer Comparison · Nifty 100" },
      { property: "og:description", content: "Radar charts and percentile leaderboards for 11 Nifty 100 peer groups." },
    ],
  }),
  component: Peers,
});

const AXES = ["roe_pct", "roce_pct", "npm_pct", "opm_pct", "asset_turnover", "sales_cagr_5yr", "net_profit_cagr_5yr", "icr"] as const;
const AXIS_LABEL: Record<(typeof AXES)[number], string> = {
  roe_pct: "ROE", roce_pct: "ROCE", npm_pct: "NPM", opm_pct: "OPM",
  asset_turnover: "AT", sales_cagr_5yr: "Rev G", net_profit_cagr_5yr: "PAT G", icr: "ICR",
};

function Peers() {
  const groups = Object.keys(peerGroups).sort();
  const [group, setGroup] = useState(groups[0]);
  const [selected, setSelected] = useState<string | null>(peerGroups[groups[0]][0]?.ticker ?? null);

  const members = peerGroups[group] ?? [];
  const memberTickers = members.map((m) => m.ticker);

  const radar = useMemo(() => {
    return AXES.map((axis) => {
      const vals = memberTickers.map((t) => {
        const c = tickerMap.get(t);
        const v = axis.endsWith("_cagr_5yr") ? c?.cagr[axis] : c?.latest[axis];
        return typeof v === "number" ? v : null;
      }).filter((v): v is number => v != null);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      const max = Math.max(...vals, 0.001);
      const selCompany = selected ? tickerMap.get(selected) : null;
      const selRaw = selCompany ? (axis.endsWith("_cagr_5yr") ? selCompany.cagr[axis] : selCompany.latest[axis]) : null;
      const sel = typeof selRaw === "number" ? selRaw : 0;
      // Normalize to 0-100
      return {
        metric: AXIS_LABEL[axis],
        Selected: Math.max(0, Math.min(100, (sel / max) * 100)),
        Average: Math.max(0, Math.min(100, (avg / max) * 100)),
      };
    });
  }, [group, selected, memberTickers]);

  const rows = useMemo(() => {
    return memberTickers.map((t) => {
      const c = tickerMap.get(t)!;
      const p = peerPercentiles.filter((x) => x.company_id === t && x.peer_group === group);
      const map = Object.fromEntries(p.map((x) => [x.metric, x.percentile]));
      return { c, map, isBenchmark: members.find((m) => m.ticker === t)?.benchmark };
    });
  }, [group, memberTickers, members]);

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <div className="term-label">MODULE · PEER GROUPS</div>
            <h1 className="text-xl font-semibold mt-1">Peer Comparison</h1>
          </div>
          <Badge tone="amber">{groups.length} GROUPS</Badge>
          <select value={group} onChange={(e) => { setGroup(e.target.value); setSelected(peerGroups[e.target.value][0]?.ticker ?? null); }}
            className="ml-auto bg-panel border border-grid px-3 py-1.5 text-[12px] tracking-wider">
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title={`Radar · ${selected ?? ""} vs ${group} average`}>
            <div className="h-96 p-2">
              <ResponsiveContainer>
                <RadarChart data={radar}>
                  <PolarGrid stroke="#2a3140" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#8b95a7", fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: "#8b95a7", fontSize: 9 }} stroke="#2a3140" />
                  <Radar name="Selected" dataKey="Selected" stroke="#f0b90b" fill="#f0b90b" fillOpacity={0.35} />
                  <Radar name="Peer avg" dataKey="Average" stroke="#00d4aa" fill="#00d4aa" fillOpacity={0.15} strokeDasharray="4 3" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="border-t border-grid px-3 py-2 flex flex-wrap gap-1.5">
              {memberTickers.map((t) => (
                <button key={t} onClick={() => setSelected(t)}
                  className={`px-2 py-1 text-[10px] tracking-wider border rounded-sm ${
                    selected === t ? "border-amber text-amber bg-accent" : "border-grid text-muted-foreground hover:text-foreground"
                  }`}>{t}</button>
              ))}
            </div>
          </Panel>

          <Panel title="Percentile Ranks · Members">
            <div className="overflow-auto max-h-[26rem]">
              <table className="w-full text-[12px]">
                <thead className="text-[10px] tracking-wider uppercase text-muted-foreground sticky top-0 bg-[color:var(--sidebar)]">
                  <tr>
                    <th className="text-left px-3 py-2">Ticker</th>
                    <th className="text-right px-2 py-2">ROE</th>
                    <th className="text-right px-2 py-2">ROCE</th>
                    <th className="text-right px-2 py-2">NPM</th>
                    <th className="text-right px-2 py-2">D/E</th>
                    <th className="text-right px-2 py-2">FCF</th>
                    <th className="text-right px-2 py-2">Rev G</th>
                    <th className="text-right px-3 py-2">PAT G</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ c, map, isBenchmark }) => (
                    <tr key={c.ticker} onClick={() => setSelected(c.ticker)}
                      className={`border-t border-grid cursor-pointer hover:bg-secondary ${
                        isBenchmark ? "bg-[oklch(0.28_0.03_82)]/30" : ""
                      } ${selected === c.ticker ? "outline outline-1 outline-amber" : ""}`}>
                      <td className="px-3 py-1.5">
                        <span className="text-amber">{c.ticker}</span>
                        {isBenchmark && <span className="ml-1.5 text-[9px] text-amber tracking-widest">◆</span>}
                      </td>
                      {(["roe_pct","roce_pct","npm_pct","de","fcf","sales_cagr_5yr","net_profit_cagr_5yr"] as const).map((m) => (
                        <td key={m} className="px-2 py-1.5 text-right tabular-nums">
                          {map[m] == null ? "—" : (
                            <span className={map[m] >= 75 ? "text-teal" : map[m] <= 25 ? "text-loss" : "text-foreground"}>
                              {fmt.num(map[m], 0)}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <Panel title="All Peer Groups">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[color:var(--grid)]">
            {groups.map((g) => (
              <button key={g} onClick={() => { setGroup(g); setSelected(peerGroups[g][0]?.ticker ?? null); }}
                className={`bg-panel p-3 text-left hover:bg-secondary ${group === g ? "outline outline-1 outline-amber" : ""}`}>
                <div className="text-amber font-medium text-[13px]">{g}</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {peerGroups[g].length} members · benchmark {peerGroups[g].find((x) => x.benchmark)?.ticker ?? "—"}
                </div>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
