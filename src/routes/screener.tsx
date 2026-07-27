import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { companies, fmt, type Company } from "@/data";
import { AppShell } from "@/components/app-shell";
import { Panel, Badge } from "@/components/ui-bits";

export const Route = createFileRoute("/screener")({
  head: () => ({
    meta: [
      { title: "Screener · Nifty 100 Analyst Terminal" },
      { name: "description", content: "Financial screener with 6 preset filters (Quality, Value, Growth, Dividend, Debt-Free, Turnaround) and custom sliders across 15 metrics." },
      { property: "og:title", content: "Financial Screener · Nifty 100" },
      { property: "og:description", content: "6 preset screeners plus custom threshold filters across the Nifty 100 universe." },
    ],
  }),
  component: Screener,
});

type Filters = {
  minROE: number; maxDE: number; minFCF: number;
  minRevCAGR: number; minPATCAGR: number; minOPM: number;
  maxPE: number; minDivYield: number; minICR: number;
};

const DEFAULTS: Filters = {
  minROE: 0, maxDE: 100, minFCF: -1e9,
  minRevCAGR: -100, minPATCAGR: -100, minOPM: -100,
  maxPE: 1e6, minDivYield: 0, minICR: 0,
};

const PRESETS: Record<string, Partial<Filters>> = {
  Quality:    { minROE: 15, maxDE: 1,   minFCF: 0,   minRevCAGR: 10 },
  Value:      { maxPE: 20,  maxDE: 2,   minDivYield: 1 },
  Growth:     { minPATCAGR: 20, minRevCAGR: 15, maxDE: 2 },
  Dividend:   { minDivYield: 2, minFCF: 0 },
  DebtFree:   { maxDE: 0,   minROE: 12 },
  Turnaround: { minRevCAGR: 10, minFCF: 0 },
};

function apply(c: Company, f: Filters): boolean {
  const roe = c.latest.roe_pct as number | null;
  const de = c.latest.de as number | null;
  const fcf = c.latest.fcf as number | null;
  const rev = c.cagr.sales_cagr_5yr as number | null;
  const pat = c.cagr.net_profit_cagr_5yr as number | null;
  const opm = c.latest.opm_pct as number | null;
  const pe = c.pe_current;
  const dy = c.div_yield;
  const icr = c.latest.icr as number | null;
  if (roe != null && roe < f.minROE) return false;
  if (de != null && de > f.maxDE) return false;
  if (fcf != null && fcf < f.minFCF) return false;
  if (rev != null && rev < f.minRevCAGR) return false;
  if (pat != null && pat < f.minPATCAGR) return false;
  if (opm != null && opm < f.minOPM) return false;
  if (pe != null && pe > f.maxPE) return false;
  if (dy != null && dy < f.minDivYield) return false;
  if (icr != null && icr < f.minICR) return false;
  return true;
}

function Slider({ label, value, onChange, min, max, step, unit }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit?: string;
}) {
  return (
    <div className="px-3 py-2 border-b border-grid">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-amber tabular-nums">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[oklch(0.82_0.16_82)] mt-1.5"
      />
    </div>
  );
}

function Screener() {
  const [f, setF] = useState<Filters>(DEFAULTS);
  const [preset, setPreset] = useState<string>("");

  const applyPreset = (name: string) => {
    setPreset(name);
    setF({ ...DEFAULTS, ...PRESETS[name] });
  };

  const results = useMemo(
    () => companies.filter((c) => apply(c, f)).sort((a, b) => (b.composite_score ?? 0) - (a.composite_score ?? 0)),
    [f]
  );

  const csv = () => {
    const cols = ["ticker","name","sector","score","roe_pct","de","opm_pct","rev_cagr_5y","pat_cagr_5y","pe","fcf","icr","div_yield","flag"];
    const rows = results.map((c) => [
      c.ticker, c.name, c.broad_sector, c.composite_score,
      c.latest.roe_pct, c.latest.de, c.latest.opm_pct,
      c.cagr.sales_cagr_5yr, c.cagr.net_profit_cagr_5yr,
      c.pe_current, c.latest.fcf, c.latest.icr, c.div_yield, c.valuation_flag,
    ].map((v) => (v == null ? "" : String(v).replace(/"/g, '""'))).map((v) => `"${v}"`).join(","));
    const blob = new Blob([cols.join(",") + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `screener_${preset || "custom"}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="p-4 flex gap-4 min-h-full">
        {/* Left rail: filters */}
        <div className="w-64 shrink-0 space-y-4">
          <Panel title="Presets">
            <div className="grid grid-cols-2 gap-px bg-[color:var(--grid)]">
              {Object.keys(PRESETS).map((k) => (
                <button key={k} onClick={() => applyPreset(k)}
                  className={`px-2 py-2 text-[11px] tracking-wider uppercase bg-panel hover:bg-secondary ${
                    preset === k ? "text-amber bg-accent" : "text-muted-foreground"
                  }`}>{k}</button>
              ))}
            </div>
            <button onClick={() => { setF(DEFAULTS); setPreset(""); }}
              className="w-full px-3 py-1.5 text-[10px] text-muted-foreground border-t border-grid hover:text-amber tracking-wider uppercase">Reset filters</button>
          </Panel>

          <Panel title="Filters">
            <Slider label="Min ROE" unit="%" value={f.minROE} min={0} max={40} step={0.5} onChange={(v) => setF({ ...f, minROE: v })} />
            <Slider label="Max D/E" value={f.maxDE} min={0} max={5} step={0.1} onChange={(v) => setF({ ...f, maxDE: v })} />
            <Slider label="Min OPM" unit="%" value={f.minOPM} min={-20} max={60} step={1} onChange={(v) => setF({ ...f, minOPM: v })} />
            <Slider label="Min Rev CAGR 5Y" unit="%" value={f.minRevCAGR} min={-20} max={40} step={1} onChange={(v) => setF({ ...f, minRevCAGR: v })} />
            <Slider label="Min PAT CAGR 5Y" unit="%" value={f.minPATCAGR} min={-20} max={40} step={1} onChange={(v) => setF({ ...f, minPATCAGR: v })} />
            <Slider label="Max P/E" value={f.maxPE > 999 ? 200 : f.maxPE} min={5} max={200} step={1} onChange={(v) => setF({ ...f, maxPE: v })} />
            <Slider label="Min Div Yield" unit="%" value={f.minDivYield} min={0} max={8} step={0.1} onChange={(v) => setF({ ...f, minDivYield: v })} />
            <Slider label="Min ICR" value={f.minICR} min={0} max={30} step={0.5} onChange={(v) => setF({ ...f, minICR: v })} />
          </Panel>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center gap-3">
            <div className="term-label">MODULE · SCREENER</div>
            <div className="ml-auto flex items-center gap-2">
              <Badge tone="teal">{results.length} MATCH</Badge>
              {preset && <Badge tone="amber">PRESET · {preset.toUpperCase()}</Badge>}
              <button onClick={csv} className="px-3 py-1 border border-amber text-amber text-[11px] tracking-wider uppercase hover:bg-accent">Export CSV</button>
            </div>
          </div>

          <Panel>
            <div className="overflow-auto">
              <table className="w-full text-[12px]">
                <thead className="text-[10px] tracking-wider uppercase text-muted-foreground bg-[color:var(--sidebar)]">
                  <tr>
                    <th className="text-left px-3 py-2">Ticker</th>
                    <th className="text-left px-2 py-2">Name</th>
                    <th className="text-left px-2 py-2">Sector</th>
                    <th className="text-right px-2 py-2">Score</th>
                    <th className="text-right px-2 py-2">ROE</th>
                    <th className="text-right px-2 py-2">D/E</th>
                    <th className="text-right px-2 py-2">OPM</th>
                    <th className="text-right px-2 py-2">Rev CAGR</th>
                    <th className="text-right px-2 py-2">PAT CAGR</th>
                    <th className="text-right px-2 py-2">P/E</th>
                    <th className="text-right px-2 py-2">Div Y</th>
                    <th className="text-right px-3 py-2">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((c) => {
                    const tone = c.valuation_flag === "Caution" ? "loss" : c.valuation_flag === "Discount" ? "teal" : "muted";
                    return (
                      <tr key={c.ticker} className="border-t border-grid hover:bg-secondary">
                        <td className="px-3 py-1.5">
                          <Link to="/company/$ticker" params={{ ticker: c.ticker }} className="text-amber">{c.ticker}</Link>
                        </td>
                        <td className="px-2 py-1.5 truncate max-w-[220px]">{c.name}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">{c.broad_sector}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-teal">{fmt.num(c.composite_score, 1)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{fmt.pct(c.latest.roe_pct as number | null)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{fmt.num(c.latest.de as number | null)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{fmt.pct(c.latest.opm_pct as number | null)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{fmt.pct(c.cagr.sales_cagr_5yr as number | null)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{fmt.pct(c.cagr.net_profit_cagr_5yr as number | null)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{fmt.num(c.pe_current)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{fmt.pct(c.div_yield)}</td>
                        <td className="px-3 py-1.5 text-right"><Badge tone={tone as "loss"|"teal"|"muted"}>{c.valuation_flag}</Badge></td>
                      </tr>
                    );
                  })}
                  {results.length === 0 && (
                    <tr><td colSpan={12} className="px-3 py-8 text-center text-muted-foreground text-[12px]">No companies match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
