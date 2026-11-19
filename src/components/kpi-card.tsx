export function KpiCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "up" | "down" | "flat";
}) {
  const toneClass =
    tone === "up" ? "text-[#2f6b4f]" : tone === "down" ? "text-hibiscus" : "text-muted";

  return (
    <article className="rounded-[10px] border border-line bg-paper p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-3 font-display text-3xl text-heading">{value}</p>
      <p className={`mt-2 text-sm ${toneClass}`}>{delta}</p>
    </article>
  );
}
