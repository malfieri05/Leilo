export function PromoFilterStats({
  counts,
}: {
  counts: { shown: number; cancelled: number; kehe: number; unfi: number };
}) {
  return (
    <dl className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      <StatPair label="In view" value={counts.shown} />
      <StatPair label="Cancelled" value={counts.cancelled} />
      <StatPair label="KEHE" value={counts.kehe} />
      <StatPair label="UNFI" value={counts.unfi} />
    </dl>
  );
}

function StatPair({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="uppercase tracking-[0.1em]">{label}</dt>
      <dd className="font-display text-sm text-heading">{value}</dd>
    </div>
  );
}