"use client";

import { useEffect, useId, useRef, useState } from "react";

export function MermaidDiagram({ source }: { source: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "loose",
          flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" },
        });
        const renderId = `mermaid-${reactId.replace(/:/g, "")}`;
        const { svg } = await mermaid.render(renderId, source);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not render diagram.");
        }
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [reactId, source]);

  if (error) {
    return (
      <p className="rounded-[10px] border border-hibiscus/40 bg-paper px-4 py-3 text-sm text-hibiscus">
        {error}
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-[24rem] w-full overflow-x-auto rounded-[10px] border border-line bg-paper p-4 [&_svg]:mx-auto [&_svg]:max-w-full"
      aria-label="Leilo business structure diagram"
    />
  );
}