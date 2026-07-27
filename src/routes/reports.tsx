import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { companies, documents } from "@/data";
import { AppShell } from "@/components/app-shell";
import { Panel, Badge } from "@/components/ui-bits";
import { ExternalLink, FileText } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Annual Reports · Nifty 100 Analyst Terminal" },
      { name: "description", content: "BSE annual report links for every Nifty 100 company, searchable by ticker or company name." },
      { property: "og:title", content: "Annual Reports · Nifty 100" },
      { property: "og:description", content: "Searchable BSE annual-report index for all 92 Nifty 100 constituents." },
    ],
  }),
  component: Reports,
});

function Reports() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return companies;
    return companies.filter((c) => c.ticker.toLowerCase().includes(s) || c.name.toLowerCase().includes(s));
  }, [q]);

  const total = Object.values(documents).reduce((a, b) => a + b.length, 0);

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="term-label">MODULE · ANNUAL REPORTS</div>
            <h1 className="text-xl font-semibold mt-1">BSE Filings Index</h1>
          </div>
          <Badge tone="amber">{total.toLocaleString()} REPORTS</Badge>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ticker or name…"
            className="ml-auto bg-panel border border-grid px-3 py-1.5 text-[12px] w-64 placeholder:text-muted-foreground" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((c) => {
            const docs = (documents[c.ticker] ?? []).sort((a, b) => b.year - a.year);
            return (
              <Panel key={c.ticker} title={`${c.ticker} · ${c.name}`} right={<Badge>{docs.length}</Badge>}>
                <div className="max-h-64 overflow-auto">
                  {docs.length === 0 && <div className="p-3 text-[12px] text-muted-foreground">No reports on file.</div>}
                  {docs.map((d) => (
                    <a key={d.year + d.url} href={d.url} target="_blank" rel="noopener"
                      className="flex items-center gap-2 px-3 py-1.5 border-b border-grid last:border-0 hover:bg-secondary text-[12px]">
                      <FileText className="h-3.5 w-3.5 text-amber" />
                      <span className="tabular-nums w-14">{d.year}</span>
                      <span className="flex-1 truncate text-muted-foreground">Annual Report · BSE PDF</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </Panel>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
