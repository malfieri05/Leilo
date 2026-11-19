export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 max-w-2xl">
      <h1 className="font-display text-3xl tracking-tight text-heading md:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-muted">{description}</p>
    </div>
  );
}
