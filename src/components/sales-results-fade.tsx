"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function SalesResultsFade({ children }: { children: ReactNode }) {
  const latest = useRef(children);
  const displayed = useRef(children);
  latest.current = children;
  const [node, setNode] = useState(children);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (Object.is(displayed.current, children)) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      displayed.current = children;
      setNode(children);
      setVisible(true);
      return;
    }
    setVisible(false);
    const timeout = window.setTimeout(() => {
      displayed.current = latest.current;
      setNode(latest.current);
      setVisible(true);
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [children]);

  return (
    <div
      className={`min-h-[24rem] transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
    >
      {node}
    </div>
  );
}