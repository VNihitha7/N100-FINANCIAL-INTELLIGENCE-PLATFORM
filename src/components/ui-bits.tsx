import { fmt } from "@/data";

export function KpiTile({
  label, value, sub, tone,
}: { label: string; value: string; sub?: string; tone?: "teal" | "amber" | "loss" | "muted" }) {
  const toneCls =
    tone === "teal" ? "text-teal" :
    tone === "amber" ? "text-amber" :
    tone === "loss" ? "text-loss" :
    tone === "muted" ? "text-muted-foreground" :
    "text-foreground";
  return (
    <div className="term-panel p-3">
      <div className="term-label">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${toneCls}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export function Panel({
  title, right, children, className = "",
}: { title?: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`term-panel ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-grid">
          <div className="term-label text-foreground">{title}</div>
          {right}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

export function StatRow({ label, value, tone }: { label: string; value: number | null | undefined; tone?: "pct" | "num" | "cr" }) {
  const disp = tone === "pct" ? fmt.pct(value) : tone === "cr" ? fmt.cr(value) : fmt.num(value);
  const cls = value == null ? "text-muted-foreground" : (Number(value) < 0 ? "text-loss" : "text-foreground");
  return (
    <div className="flex justify-between items-center px-3 py-1.5 border-b border-grid last:border-0 text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${cls}`}>{disp}</span>
    </div>
  );
}

export function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "teal" | "amber" | "loss" | "muted" }) {
  const cls = {
    teal: "text-teal border-[oklch(0.78_0.14_175)]/40 bg-[oklch(0.78_0.14_175)]/10",
    amber: "text-amber border-[oklch(0.82_0.16_82)]/40 bg-[oklch(0.82_0.16_82)]/10",
    loss: "text-loss border-[oklch(0.68_0.22_25)]/40 bg-[oklch(0.68_0.22_25)]/10",
    muted: "text-muted-foreground border-grid bg-secondary",
  }[tone];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] tracking-wider uppercase border rounded-sm ${cls}`}>
      {children}
    </span>
  );
}
