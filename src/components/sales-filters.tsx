"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { InfoTip } from "@/components/info-tip";
import { SlideToggle } from "@/components/slide-toggle";
import { channelDescriptions, channelTitles } from "@/lib/sales-channel";
import {
  channelKeys,
  rangeKeys,
  regionKeys,
  salesQueryString,
  segmentLabel,
  type ChannelKey,
  type RangeKey,
  type RegionKey,
  type SalesQuery,
  type SegmentKey,
} from "@/lib/sources/sales-overview-model";

const channelLabels: Record<ChannelKey, string> = {
  all: "All",
  direct: "Direct",
  kehe: "KEHE",
  dsd: "DSD",
  unfi: "UNFI",
};

const regionLabels: Record<RegionKey, string> = {
  nationwide: "Nationwide",
  california: "California",
  southeast: "Southeast",
};

const rangeLabels: Record<RangeKey, string> = {
  mtd: "MTD",
  ytd: "YTD",
  "ytd-vs": "YTD vs last year",
  custom: "Custom",
  all: "All time",
};

export function SalesFilters({
  query,
  periodLabel,
  compareLabel,
  showChannelFilter = false,
}: {
  query: SalesQuery;
  periodLabel: string;
  compareLabel: string | null;
  showChannelFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [customOpen, setCustomOpen] = useState(query.range === "custom");
  const [from, setFrom] = useState(query.from ?? "");
  const [to, setTo] = useState(query.to ?? "");

  useEffect(() => {
    setFrom(query.from ?? "");
    setTo(query.to ?? "");
    setCustomOpen(query.range === "custom");
  }, [query.from, query.range, query.to]);

  useEffect(() => {
    for (const region of regionKeys) {
      router.prefetch(hrefFor({ region }));
    }
    for (const range of rangeKeys) {
      if (range === "custom") continue;
      router.prefetch(hrefFor({ range, from: null, to: null }));
    }
    if (!showChannelFilter) return;
    for (const channel of channelKeys) {
      router.prefetch(hrefFor({ channel, partner: channel === "dsd" ? query.partner : null }));
    }
  }, [pathname, query, router, showChannelFilter]);

  function hrefFor(patch: Partial<SalesQuery>) {
    return `${pathname}${salesQueryString(query, patch)}`;
  }

  function go(patch: Partial<SalesQuery>) {
    const href = hrefFor(patch);
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function intent(patch: Partial<SalesQuery>) {
    router.prefetch(hrefFor(patch));
  }

  const periodValue: RangeKey = customOpen ? "custom" : query.range;

  return (
    <div className="sticky top-16 z-10 -mx-4 mb-6 border-b border-line bg-foam/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="flex flex-col items-start gap-2.5">
        {showChannelFilter ? (
          <section
            aria-labelledby="sales-channel-heading"
            className="inline-flex max-w-full flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2.5">
              <h2
                id="sales-channel-heading"
                className="font-display text-2xl font-semibold tracking-tight text-heading md:text-3xl"
              >
                {channelTitles[query.channel]}
              </h2>
              <InfoTip text={channelDescriptions[query.channel]} />
            </div>
            <div className="max-w-full overflow-x-auto">
              <SlideToggle
                label="Ordering method"
                value={query.channel}
                options={channelKeys.map((channel) => ({ id: channel, label: channelLabels[channel] }))}
                onIntent={(channel) => intent({ channel, partner: channel === "dsd" ? query.partner : null })}
                onChange={(channel) => {
                  const patch: Partial<SalesQuery> = { channel };
                  if (channel !== "dsd") patch.partner = null;
                  go(patch);
                }}
              />
            </div>
          </section>
        ) : null}
        <div className="overflow-x-auto">
          <SlideToggle
            label="Region"
            value={query.region}
            options={regionKeys.map((region) => ({ id: region, label: regionLabels[region] }))}
            onIntent={(region) => intent({ region })}
            onChange={(region) => go({ region })}
          />
        </div>
        <div className="flex w-full max-w-full flex-col gap-2.5">
          <div className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-2">
            <div className="shrink-0 overflow-x-auto">
              <SlideToggle
                label="Period"
                value={periodValue}
                options={rangeKeys.map((range) => ({ id: range, label: rangeLabels[range] }))}
                onIntent={(range) => {
                  if (range === "custom") return;
                  intent({ range, from: null, to: null });
                }}
                onChange={(range) => {
                  if (range === "custom") {
                    setCustomOpen(true);
                    return;
                  }
                  setCustomOpen(false);
                  go({ range, from: null, to: null });
                }}
              />
            </div>
            {customOpen ? (
              <form
                className="flex shrink-0 flex-wrap items-end gap-2 rounded-[14px] border border-line bg-paper p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (from && to) go({ range: "custom", from, to });
                }}
              >
                <label className="text-xs uppercase tracking-[0.12em] text-muted">
                  From
                  <input
                    type="date"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                    required
                    className="mt-1 block rounded-[10px] border border-line bg-paper px-3 py-1.5 text-sm text-ink"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.12em] text-muted">
                  To
                  <input
                    type="date"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    required
                    className="mt-1 block rounded-[10px] border border-line bg-paper px-3 py-1.5 text-sm text-ink"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-[10px] bg-heading px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-paper"
                >
                  Apply
                </button>
              </form>
            ) : null}
            <p className="min-w-0 shrink text-sm text-muted sm:shrink-0">
              {periodLabel}
              {compareLabel ? ` · vs ${compareLabel}` : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SegmentControls({ query, options }: { query: SalesQuery; options: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function go(patch: Partial<SalesQuery>) {
    const href = `${pathname}${salesQueryString(query, patch)}`;
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  const segments: { id: SegmentKey; label: string }[] = [
    { id: "industry", label: "Industry Type" },
    { id: "customer", label: "Customer Type" },
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <SlideToggle
        label="Tier segment"
        value={query.segment}
        options={segments}
        onChange={(segment) => go({ segment, segmentValue: "" })}
      />
      <label className="text-xs uppercase tracking-[0.12em] text-muted">
        <span className="sr-only">Segment value</span>
        <select
          value={query.segmentValue}
          onChange={(event) => go({ segmentValue: event.target.value })}
          className="rounded-[10px] border border-line bg-paper px-3 py-1.5 text-sm normal-case tracking-normal text-ink"
        >
          <option value="">All</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {segmentLabel(option)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

