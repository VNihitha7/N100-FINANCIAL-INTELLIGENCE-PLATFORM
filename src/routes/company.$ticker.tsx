import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCompany, fmt, prices, documents, peerPercentiles } from "@/data";
import { AppShell } from "@/components/app-shell";
import { KpiTile, Panel, Badge, StatRow } from "@/components/ui-bits";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ComposedChart, Area,
} from "recharts";
import { Check, X, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/company/$ticker")({
  loader: ({ params }) => {
    const c = getCompany(params.ticker);
    if (!c) throw notFound();
    return { ticker: params.ticker };
  },
  head: ({ params }) => {
    const c = getCompany(params.ticker);
    const name = c?.name ?? params.ticker;
    return {
      meta: [
        { title: `${name} (${params.ticker}) · Nifty 100 Analyst Terminal` },
        { name: "description", content: `Financial profile for ${name}: ROE, ROCE, D/E, cash flows, KPI history and peer positioning across the Nifty 100 universe.` },
        { property: "og:title", content: `${name} (${params.ticker}) · Financial Profile` },
        { property: "og:description", content: `10-year KPIs, cash flow composition and peer percentile ranks for ${name}.` },
      ],
    };
  },
  component: Profile,
});

const tone = (v: number | null | undefined, good: "up" | "down" = "up", threshold = 0) => {
  if (v == null) return "muted";
  return good === "up" ? (v >= threshold ? "teal" : "loss") : (v <= threshold ? "teal" : "loss");
};

function Profile() {
  const { ticker } = Route.useLoaderData();
  const c = getCompany(ticker)!;
  const px = prices[ticker] || [];
  const docs = documents[ticker] || [];
  const pctils = peerPercentiles.filter((p) => p.company_id === ticker);

  const roe = c.latest.roe_pct as number | null;
  const roce = c.latest.roce_pct as number | null;
  const npm = c.latest.npm_pct as number | null;
  const de = c.latest.de as number | null;
  const opm = c.latest.opm_pct as number | null;
  const fcf = c.latest.fcf as number | null;

  const bsData = c.history.map((h) => ({ y: h.y, Equity: h.eq ?? 0, Reserves: h.res ?? 0, Borrowings: h.bor ?? 0 }));
  const cfLatest = c.history.at(-1);

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        {/* Header */}
        <Panel className="!p-0">
          <div className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 rounded bg-secondary border border-grid flex items-center justify-center text-amber font-bold text-lg">
              {ticker.slice(0, 3)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-amber font-semibold tracking-wider">{ticker}</span>
                <span className="text-muted-foreground">·</span>
                <h1 className="text-lg font-semibold truncate">{c.name}</h1>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                <Badge tone="amber">{c.broad_sector ?? "—"}</Badge>
                <Badge>{c.sub_sector ?? "—"}</Badge>
                <Badge>{c.market_cap_category ?? "—"}</Badge>
                {c.cluster && <Badge tone="teal">CLUSTER · {c.cluster}</Badge>}
                {c.pattern && <Badge tone="amber">CAP · {c.pattern}</Badge>}
                <Badge tone={c.valuation_flag === "Caution" ? "loss" : c.valuation_flag === "Discount" ? "teal" : "muted"}>
                  VAL · {c.valuation_flag}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="term-label">Composite</div>
              <div className="text-3xl font-bold text-teal tabular-nums">{fmt.num(c.composite_score, 1)}</div>
              <div className="text-[10px] text-muted-foreground">/ 100</div>
            </div>
          </div>
          {c.about && (
            <div className="border-t border-grid px-4 py-3 text-[12px] text-muted-foreground leading-relaxed">{c.about}</div>
          )}
        </Panel>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiTile label="ROE" value={fmt.pct(roe)} tone={tone(roe, "up", 15) as "teal" | "loss" | "muted"} sub="Latest FY" />
          <KpiTile label="ROCE" value={fmt.pct(roce)} tone={tone(roce, "up", 15) as "teal" | "loss" | "muted"} />
          <KpiTile label="Net Profit Margin" value={fmt.pct(npm)} />
          <KpiTile label="D/E" value={fmt.num(de)} tone={tone(de, "down", 1) as "teal" | "loss" | "muted"} />
          <KpiTile label="OPM" value={fmt.pct(opm)} />
          <KpiTile label="Free Cash Flow" value={fmt.cr(fcf)} tone={tone(fcf, "up", 0) as "teal" | "loss" | "muted"} />
        </div>

        {/* Row 2: revenue/np + roe/roce */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Revenue & Net Profit · Long term">
            <div className="h-72 p-2">
              <ResponsiveContainer>
                <ComposedChart data={c.history} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid stroke="#2a3140" strokeDasharray="2 2" />
                  <XAxis dataKey="y" tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false} />
                  <YAxis tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#151b23", border: "1px solid #2a3140", fontSize: 11 }} />
                  <Bar dataKey="sales" name="Sales" fill="#f0b90b" opacity={0.85} />
                  <Line dataKey="np" name="Net Profit" stroke="#00d4aa" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="ROE & ROCE · Trend">
            <div className="h-72 p-2">
              <ResponsiveContainer>
                <LineChart data={c.history}>
                  <CartesianGrid stroke="#2a3140" strokeDasharray="2 2" />
                  <XAxis dataKey="y" tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false} />
                  <YAxis tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#151b23", border: "1px solid #2a3140", fontSize: 11 }} />
                  <Line dataKey="roe" name="ROE %" stroke="#f0b90b" strokeWidth={2} dot={false} />
                  <Line dataKey="roce" name="ROCE %" stroke="#00d4aa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Row 3: BS + Cash flow + price */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title="Balance Sheet composition">
            <div className="h-64 p-2">
              <ResponsiveContainer>
                <BarChart data={bsData} stackOffset="none">
                  <CartesianGrid stroke="#2a3140" strokeDasharray="2 2" />
                  <XAxis dataKey="y" tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false} />
                  <YAxis tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#151b23", border: "1px solid #2a3140", fontSize: 11 }} />
                  <Bar dataKey="Equity" stackId="a" fill="#f0b90b" />
                  <Bar dataKey="Reserves" stackId="a" fill="#00d4aa" />
                  <Bar dataKey="Borrowings" stackId="a" fill="#e06c75" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="Cash Flow · Latest FY">
            <div className="p-2">
              <StatRow label="CFO · Operating" value={cfLatest?.cfo} tone="cr" />
              <StatRow label="CFI · Investing" value={cfLatest?.cfi} tone="cr" />
              <StatRow label="CFF · Financing" value={cfLatest?.cff} tone="cr" />
              <StatRow label="Free Cash Flow" value={cfLatest?.fcf} tone="cr" />
              <div className="px-3 py-2 border-t border-grid mt-1">
                <div className="term-label">Capital Allocation Pattern</div>
                <div className="text-amber font-medium mt-1">{c.pattern ?? "—"}</div>
              </div>
            </div>
          </Panel>
          <Panel title="Stock Price · Monthly Close">
            <div className="h-64 p-2">
              <ResponsiveContainer>
                <LineChart data={px}>
                  <CartesianGrid stroke="#2a3140" strokeDasharray="2 2" />
                  <XAxis dataKey="d" tick={{ fill: "#8b95a7", fontSize: 9 }} axisLine={{ stroke: "#2a3140" }} tickLine={false} minTickGap={30} />
                  <YAxis tick={{ fill: "#8b95a7", fontSize: 10 }} axisLine={{ stroke: "#2a3140" }} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#151b23", border: "1px solid #2a3140", fontSize: 11 }} />
                  <Line dataKey="c" stroke="#f0b90b" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Row 4: pros/cons + peer ranks + valuation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title="Pros · Auto-generated" right={<Badge tone="teal">RULE ENGINE</Badge>}>
            <div className="p-3 space-y-2">
              {c.pros_auto.map((p, i) => (
                <div key={i} className="flex gap-2 items-start text-[12px]">
                  <Check className="h-3.5 w-3.5 text-teal mt-0.5 shrink-0" />
                  <div>
                    <span className="text-teal font-medium text-[10px] tracking-wider uppercase mr-1.5">{p.code}</span>
                    <span className="text-foreground/90">{p.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Cons · Auto-generated" right={<Badge tone="loss">RULE ENGINE</Badge>}>
            <div className="p-3 space-y-2">
              {c.cons_auto.map((p, i) => (
                <div key={i} className="flex gap-2 items-start text-[12px]">
                  <X className="h-3.5 w-3.5 text-loss mt-0.5 shrink-0" />
                  <div>
                    <span className="text-loss font-medium text-[10px] tracking-wider uppercase mr-1.5">{p.code}</span>
                    <span className="text-foreground/90">{p.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Peer Percentile Ranks">
            <div className="p-1">
              {pctils.length === 0 && <div className="p-3 text-[12px] text-muted-foreground">No peer group assigned.</div>}
              {pctils.map((p, i) => (
                <div key={i} className="px-3 py-1.5 border-b border-grid last:border-0">
                  <div className="flex justify-between text-[11px] items-center">
                    <span className="text-muted-foreground uppercase tracking-wider">{p.metric}</span>
                    <span className="tabular-nums text-amber">{p.percentile.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 h-1 bg-secondary rounded-sm overflow-hidden">
                    <div className="h-full bg-[oklch(0.82_0.16_82)]" style={{ width: `${p.percentile}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Row 5: Valuation snapshot & documents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel title="Valuation Snapshot" className="lg:col-span-1">
            <StatRow label="P/E" value={c.pe_current} />
            <StatRow label="P/B" value={c.pb_current} />
            <StatRow label="EV / EBITDA" value={c.ev_ebitda} />
            <StatRow label="Dividend Yield" value={c.div_yield} tone="pct" />
            <StatRow label="FCF Yield" value={c.fcf_yield} tone="pct" />
            <StatRow label="Book Value" value={c.book_value} />
          </Panel>
          <Panel title="CAGR · 3 / 5 / 10 year" className="lg:col-span-1">
            {(["sales_cagr","net_profit_cagr","eps_cagr"] as const).map((m) => (
              <div key={m} className="px-3 py-2 border-b border-grid last:border-0">
                <div className="term-label mb-1">{m.replace("_cagr","").replace("_"," ")}</div>
                <div className="grid grid-cols-3 gap-2 text-[12px] tabular-nums">
                  {[3,5,10].map((n) => {
                    const v = c.cagr[`${m}_${n}yr`] as number | null | undefined;
                    return (
                      <div key={n} className="term-panel !bg-secondary p-2">
                        <div className="text-[9px] text-muted-foreground tracking-wider">{n}Y</div>
                        <div className={v == null ? "text-muted-foreground" : (v >= 0 ? "text-teal" : "text-loss")}>{fmt.pct(v)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </Panel>
          <Panel title="Annual Reports">
            <div className="max-h-64 overflow-auto">
              {docs.length === 0 && <div className="p-3 text-[12px] text-muted-foreground">No reports on file.</div>}
              {docs.sort((a,b)=>b.year-a.year).map((d) => (
                <a key={d.year} href={d.url} target="_blank" rel="noopener"
                  className="flex items-center gap-2 px-3 py-1.5 border-b border-grid last:border-0 hover:bg-secondary text-[12px]">
                  <span className="text-amber tabular-nums w-12">{d.year}</span>
                  <span className="flex-1 truncate text-muted-foreground">Annual Report · BSE</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </Panel>
        </div>

        <div className="flex gap-2 pt-2">
          <Link to="/screener" className="text-[11px] tracking-wider uppercase text-muted-foreground hover:text-amber">← Screener</Link>
          <span className="text-muted-foreground">/</span>
          <Link to="/peers" className="text-[11px] tracking-wider uppercase text-muted-foreground hover:text-amber">Peer Comparison →</Link>
        </div>
      </div>
    </AppShell>
  );
}
