import type { ReactNode } from "react";

export function ScrollRegion({
  children,
  className = "",
  tall = false,
  compact = false,
}: {
  children: ReactNode;
  className?: string;
  /** Taller cap for wide tables (e.g. industry breakdown). */
  tall?: boolean;
  /** Shorter cap for nested lists inside a table cell. */
  compact?: boolean;
}) {
  const size = compact ? " ark-scroll-panel--compact" : tall ? " ark-scroll-panel--tall" : "";
  return (
    <div className={`ark-scroll-panel${size}${className ? ` ${className}` : ""}`}>{children}</div>
  );
}