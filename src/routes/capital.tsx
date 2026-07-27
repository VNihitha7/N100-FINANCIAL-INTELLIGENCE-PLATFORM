import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { companies, fmt } from "@/data";
import { AppShell } from "@/components/app-shell";
import { Panel, Badge } from "@/components/ui-bits";

export const Route = createFileRoute("/capital")({
  head: () => ({
    meta: [
      { title: "Capital Allocation · Nifty 100 Analyst Terminal" },
      { name: "description", content: "8-pattern capital allocation map for the Nifty 100: Reinvestor, Cash Accumulator, Distress Signal and more, based on CFO/CFI/CFF signs." },
      { property: "og:title", content: "Capital Allocation Map · Nifty 100" },
      { property: "og:description", content: "8-pattern classification of every Nifty 100 company by cash flow signs." },
    ],
  }),
  component: Capital,
});

const PATTERN_COLORS: Record<string, string> = {
  "Reinvestor": "#00d4aa",
  "Cash Accumulator": "#f0b90b",
  "Debt-Funded Growth": "#e06c75",
  "Distress Signal": "#c9425c",
  "Liquidating Assets": "#e5c07b",
  "Pre-Revenue": "#8b95a7",
  "Rebalancing": "#7aa2f7",
  "Mixed": "#c678dd",
};

function Capital() {
  const [active, setActive] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof companies>();
    for (const c of companies) {
      const p = c.pattern ?? "Mixed";
      if (!m.has(p)) m.set(p, []);
      m.get(p)!.push(c);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, []);

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="term-label">MODULE · CAPITAL ALLOCATION</div>
            <h1 className="text-xl font-semibold mt-1">8-Pattern Map</h1>
          </div>
          <Badge tone="amber">CFO / CFI / CFF SIGNS · LATEST FY</Badge>
        </div>

        {/* Treemap-style tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {grouped.map(([pattern, list]) => {
            const color = PATTERN_COLORS[pattern] ?? "#8b95a7";
            const on = active === pattern;
            return (
              <button key={pattern} onClick={() => setActive(on ? null : pattern)}
                className={`term-panel text-left p-3 hover:brightness-110 transition ${on ? "outline outline-1 outline-amber" : ""}`}
                style={{ borderColor: color + "60", background: `linear-gradient(135deg, ${color}22, transparent)` }}>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
                  <span className="text-[11px] tracking-wider uppercase font-medium">{pattern}</span>
                </div>
                <div className="text-3xl font-bold mt-2 tabular-nums" style={{ color }}>{list.length}</div>
                <div className="text-[10px] text-muted-foreground mt-1">companies</div>
              </button>
            );
          })}
        </div>

        {active && (
          <Panel title={`Companies · ${active}`} right={
            <button onClick={() => setActive(null)} className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-amber">Clear</button>
          }>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[color:var(--grid)]">
              {companies.filter((c) => c.pattern === active).map((c) => (
                <a key={c.ticker} href={`/company/${c.ticker}`} className="bg-panel p-3 hover:bg-secondary flex items-center gap-3">
                  <span className="text-amber w-20 truncate">{c.ticker}</span>
                  <span className="flex-1 truncate text-[12px]">{c.name}</span>
                  <span className="text-muted-foreground text-[11px]">{c.broad_sector}</span>
                </a>
              ))}
            </div>
          </Panel>
        )}

        <Panel title="Latest Cash Flow Signs · All Companies">
          <div className="overflow-auto max-h-[32rem]">
            <table className="w-full text-[12px]">
              <thead className="text-[10px] tracking-wider uppercase text-muted-foreground sticky top-0 bg-[color:var(--sidebar)]">
                <tr>
                  <th className="text-left px-3 py-2">Ticker</th>
                  <th className="text-left px-2 py-2">Name</th>
                  <th className="text-left px-2 py-2">Pattern</th>
                  <th className="text-right px-2 py-2">CFO</th>
                  <th className="text-right px-2 py-2">CFI</th>
                  <th className="text-right px-2 py-2">CFF</th>
                  <th className="text-right px-3 py-2">FCF</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => {
                  const last = c.history.at(-1);
                  const color = PATTERN_COLORS[c.pattern ?? "Mixed"] ?? "#8b95a7";
                  return (
                    <tr key={c.ticker} className="border-t border-grid hover:bg-secondary">
                      <td className="px-3 py-1.5"><a className="text-amber" href={`/company/${c.ticker}`}>{c.ticker}</a></td>
                      <td className="px-2 py-1.5 truncate max-w-[220px]">{c.name}</td>
                      <td className="px-2 py-1.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-sm" style={{ background: color }} />
                          {c.pattern ?? "—"}
                        </span>
                      </td>
                      <td className={`px-2 py-1.5 text-right tabular-nums ${last?.cfo != null && last.cfo < 0 ? "text-loss" : "text-teal"}`}>{fmt.cr(last?.cfo)}</td>
                      <td className={`px-2 py-1.5 text-right tabular-nums ${last?.cfi != null && last.cfi < 0 ? "text-loss" : "text-teal"}`}>{fmt.cr(last?.cfi)}</td>
                      <td className={`px-2 py-1.5 text-right tabular-nums ${last?.cff != null && last.cff < 0 ? "text-loss" : "text-teal"}`}>{fmt.cr(last?.cff)}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums ${last?.fcf != null && last.fcf < 0 ? "text-loss" : "text-teal"}`}>{fmt.cr(last?.fcf)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
