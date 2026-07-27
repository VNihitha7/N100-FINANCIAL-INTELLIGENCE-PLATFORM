// Typed accessors for the baked-in Nifty 100 dataset.
// All files live under src/data/ and are produced by /tmp/etl/build.py.
import companiesRaw from "./companies.json";
import pricesRaw from "./prices.json";
import documentsRaw from "./documents.json";
import peerGroupsRaw from "./peer_groups.json";
import sectorStatsRaw from "./sector_stats.json";
import portfolioStatsRaw from "./portfolio_stats.json";
import peerPercentilesRaw from "./peer_percentiles.json";

export type HistPoint = {
  y: number;
  sales: number | null; np: number | null; roe: number | null; roce: number | null;
  de: number | null; opm: number | null; fcf: number | null;
  cfo: number | null; cfi: number | null; cff: number | null;
  eps: number | null; ta: number | null; eq: number | null; res: number | null; bor: number | null;
};

export type Company = {
  ticker: string;
  name: string;
  logo: string | null;
  chart_link: string | null;
  about: string | null;
  broad_sector: string | null;
  sub_sector: string | null;
  market_cap_category: string | null;
  index_weight_pct: number | null;
  book_value: number | null;
  roe_pct_src: number | null;
  roce_pct_src: number | null;
  latest: Record<string, number | null>;
  cagr: Record<string, number | null>;
  composite_score: number | null;
  cluster: string | null;
  pattern: string | null;
  valuation_flag: "Caution" | "Discount" | "Fair" | "N/A";
  pe_current: number | null;
  pb_current: number | null;
  ev_ebitda: number | null;
  div_yield: number | null;
  fcf_yield: number | null;
  history: HistPoint[];
  pros_auto: { code: string; text: string }[];
  cons_auto: { code: string; text: string }[];
  pros_manual: string;
  cons_manual: string;
};

export const companies = companiesRaw as unknown as Company[];
export const prices = pricesRaw as unknown as Record<string, { d: string; c: number; v: number }[]>;
export const documents = documentsRaw as unknown as Record<string, { year: number; url: string }[]>;
export const peerGroups = peerGroupsRaw as unknown as Record<string, { ticker: string; benchmark: boolean }[]>;
export const sectorStats = sectorStatsRaw as unknown as Record<string, {
  count: number; median_roe: number | null; median_roce: number | null;
  median_de: number | null; median_pe: number | null; tickers: string[];
}>;
export const portfolioStats = portfolioStatsRaw as unknown as Record<string, Record<string, number | null>>;
export const peerPercentiles = peerPercentilesRaw as unknown as
  { company_id: string; peer_group: string; metric: string; value: number; percentile: number }[];

export const tickerMap = new Map(companies.map((c) => [c.ticker, c]));
export const getCompany = (ticker: string) => tickerMap.get(ticker);

export const fmt = {
  num: (v: number | null | undefined, d = 2) =>
    v === null || v === undefined || Number.isNaN(v) ? "—" : Number(v).toFixed(d),
  pct: (v: number | null | undefined, d = 1) =>
    v === null || v === undefined || Number.isNaN(v) ? "—" : `${Number(v).toFixed(d)}%`,
  cr: (v: number | null | undefined) => {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    const n = Number(v);
    if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)}L Cr`;
    if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K Cr`;
    return `₹${n.toFixed(0)} Cr`;
  },
  signed: (v: number | null | undefined, d = 1) => {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    const s = Number(v).toFixed(d);
    return Number(v) > 0 ? `+${s}` : s;
  },
};

export const SECTORS = Object.keys(sectorStats).sort();
