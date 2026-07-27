import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { companies, fmt, SECTORS } from "@/data";
import { AppShell } from "@/components/app-shell";
import { Panel, Badge, KpiTile } from "@/components/ui-bits";

export const Route = createFileRoute("/valuation")({
  head: () => ({
    meta: [
      { title: "Valuation · Nifty 100 Analyst Terminal" },
      { name: "description", content: "Valuation multiples across the Nifty 100 with P/E vs sector median flags: Caution, Fair, Discount, and FCF yield." },
      { property: "og:title", content: "Valuation Summary · Nifty 100" },
      { property: "og:description", content: "P/E, P/B, EV/EBITDA, dividend yield and FCF yield with sector-relative flags." },
    ],
  }),
  component: Valuation,
});

function Valuation() {
  const [sector, setSector] = useState<string>("All");
  const [flag, setFlag] = useState<string>("All");

  const list = useMemo(() => companies.filter((c) => {
    if (sector !== "All" && c.broad_sector !== sector) return false;
    if (flag !== "All" && c.valuation_flag !== flag) return false;
    return true;
  }).sort((a, b) => (a.pe_current ?? 999) - (b.pe_current ?? 999)), [sector, flag]);

  const counts = useMemo(() => {
    const c = { Caution: 0, Fair: 0, Discount: 0, "N/A": 0 } as Record<string, number>;
    companies.forEach((x) => { c[x.valuation_flag] = (c[x.valuation_flag] ?? 0) + 1; });
    return c;
  }, []);

  const exportCsv = () => {
    const cols = ["ticker","name","sector","pe","pb","ev_ebitda","div_yield_pct","fcf_yield_pct","flag"];
    const rows = list.map((c) => [c.ticker, c.name, c.broad_sector, c.pe_current, c.pb_current, c.ev_ebitda, c.div_yield, c.fcf_yield, c.valuation_flag]
      .map((v) => v == null ? "" : String(v).replace(/"/g,'""')).map((v) => `"${v}"`).join(","));
    const blob = new Blob([cols.join(",") + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "valuation_summary.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="term-label">MODULE · VALUATION</div>
            <h1 className="text-xl font-semibold mt-1">Valuation Summary</h1>
          </div>
          <select value={sector} onChange={(e) => setSector(e.target.value)} className="bg-panel border border-grid px-3 py-1.5 text-[12px] ml-auto">
            <option>All</option>
            {SECTORS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={flag} onChange={(e) => setFlag(e.target.value)} className="bg-panel border border-grid px-3 py-1.5 text-[12px]">
            {["All","Caution","Fair","Discount","N/A"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <button onClick={exportCsv} className="px-3 py-1.5 border border-amber text-amber text-[11px] tracking-wider uppercase hover:bg-accent">Export CSV</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile label="Caution" value={String(counts.Caution ?? 0)} tone="loss" sub="P/E > 1.5× sector median" />
          <KpiTile label="Fair" value={String(counts.Fair ?? 0)} tone="muted" sub="Within sector band" />
          <KpiTile label="Discount" value={String(counts.Discount ?? 0)} tone="teal" sub="P/E < 0.7× sector median" />
          <KpiTile label="Coverage" value={fmt.pct(((counts.Caution + counts.Fair + counts.Discount) / companies.length) * 100, 0)} sub="Companies with valuation data" />
        </div>

        <Panel>
          <div className="overflow-auto">
            <table className="w-full text-[12px]">
              <thead className="text-[10px] tracking-wider uppercase text-muted-foreground bg-[color:var(--sidebar)]">
                <tr>
                  <th className="text-left px-3 py-2">Ticker</th>
                  <th className="text-left px-2 py-2">Name</th>
                  <th className="text-left px-2 py-2">Sector</th>
                  <th className="text-right px-2 py-2">P/E</th>
                  <th className="text-right px-2 py-2">P/B</th>
                  <th className="text-right px-2 py-2">EV/EBITDA</th>
                  <th className="text-right px-2 py-2">Div Yield</th>
                  <th className="text-right px-2 py-2">FCF Yield</th>
                  <th className="text-right px-3 py-2">Flag</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const tone = c.valuation_flag === "Caution" ? "loss" : c.valuation_flag === "Discount" ? "teal" : "muted";
                  return (
                    <tr key={c.ticker} className="border-t border-grid hover:bg-secondary">
                      <td className="px-3 py-1.5"><a className="text-amber" href={`/company/${c.ticker}`}>{c.ticker}</a></td>
                      <td className="px-2 py-1.5 truncate max-w-[220px]">{c.name}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{c.broad_sector}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt.num(c.pe_current)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt.num(c.pb_current)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt.num(c.ev_ebitda)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt.pct(c.div_yield)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmt.pct(c.fcf_yield)}</td>
                      <td className="px-3 py-1.5 text-right"><Badge tone={tone as "loss"|"teal"|"muted"}>{c.valuation_flag}</Badge></td>
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
