"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export function SlideToggle<T extends string>({
  label,
  value,
  options,
  onChange,
  onIntent,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
  onIntent?: (id: T) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ left: 0, width: 0, ready: false });

  const measure = useCallback(() => {
    const track = trackRef.current;
    const active = track?.querySelector<HTMLElement>("[aria-selected='true']");
    if (!track || !active) return;
    setThumb({ left: active.offsetLeft, width: active.offsetWidth, ready: true });
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, options, value]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(track);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label={label}
      className="relative inline-flex items-center rounded-full bg-heading/[0.06] p-1"
    >
      <span
        aria-hidden
        className={`absolute top-1 bottom-1 rounded-full bg-paper shadow-[0_1px_2px_rgba(15,23,42,0.12)] ring-1 ring-lime ${
          thumb.ready
            ? "transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            : ""
        }`}
        style={{ left: thumb.left, width: thumb.width, opacity: thumb.ready ? 1 : 0 }}
      />
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.id)}
            onMouseEnter={() => onIntent?.(option.id)}
            onFocus={() => onIntent?.(option.id)}
            className={`relative z-10 rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors duration-300 motion-reduce:transition-none ${
              selected ? "text-heading" : "text-muted hover:text-heading"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}