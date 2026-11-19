export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[10px] border border-line bg-paper p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl text-heading">{title}</h2>
        {action ? <p className="text-xs uppercase tracking-[0.14em] text-muted">{action}</p> : null}
      </div>
      {children}
    </section>
  );
}
