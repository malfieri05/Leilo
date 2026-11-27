export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const actionLooksLikeLabel = typeof action === "string";
  return (
    <section className="ark-surface p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl text-heading">{title}</h2>
        {action ? (
          actionLooksLikeLabel ? (
            <p className="text-xs uppercase tracking-[0.14em] text-muted">{action}</p>
          ) : (
            <div className="text-xs uppercase tracking-[0.14em] text-muted">{action}</div>
          )
        ) : null}
      </div>
      {children}
    </section>
  );
}
