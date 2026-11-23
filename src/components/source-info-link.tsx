"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const TOOLTIP_Z = 9999;

export function SourceInfoLink({ href, label }: { href: string; label: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const reposition = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 6,
      left: rect.left + rect.width / 2,
    });
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const show = useCallback(() => {
    cancelHide();
    reposition();
    setOpen(true);
  }, [cancelHide, reposition]);

  const scheduleHide = useCallback(() => {
    cancelHide();
    hideTimer.current = setTimeout(() => setOpen(false), 120);
  }, [cancelHide]);

  useEffect(() => {
    if (!open) return;
    const update = () => reposition();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, reposition]);

  useEffect(() => () => cancelHide(), [cancelHide]);

  const tooltip =
    mounted && open
      ? createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            onMouseEnter={show}
            onMouseLeave={scheduleHide}
            className="fixed w-56 -translate-x-1/2 rounded-[10px] border border-line bg-paper px-3 py-2 text-left text-xs text-ink shadow-lg"
            style={{ top: coords.top, left: coords.left, zIndex: TOOLTIP_Z }}
          >
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-lagoon underline-offset-2 hover:underline"
            >
              {label}
            </a>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="ml-2 inline-flex h-[1.125rem] w-[1.125rem] cursor-help items-center justify-center rounded-full border border-line bg-paper align-middle text-[10px] font-semibold leading-none text-muted transition-colors hover:border-lagoon hover:text-ink"
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        onFocus={show}
        onBlur={scheduleHide}
      >
        i
      </button>
      {tooltip}
    </>
  );
}