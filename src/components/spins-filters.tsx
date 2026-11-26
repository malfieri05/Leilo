"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { SlideToggle } from "@/components/slide-toggle";
import { regionKeys, regionLabel, type RegionKey } from "@/lib/sources/sales-overview-model";
import {
  reportLabel,
  SPINS_PERIOD_WEEKS,
  SPINS_REPORT_KINDS,
  SPINS_SCOPES,
  spinsQueryString,
  type SpinsPeriodWeeks,
  type SpinsQuery,
  type SpinsReportKind,
  type SpinsScope,
} from "@/lib/sources/spins-model";

const scopeLabels: Record<SpinsScope, string> = {
  competitors: "Competitors",
  all: "All brands",
};

type WeeksKey = `${SpinsPeriodWeeks}`;

const weeksOptions = SPINS_PERIOD_WEEKS.map((weeks) => ({
  id: String(weeks) as WeeksKey,
  label: `${weeks} weeks`,
}));

export function SpinsFilters({ query }: { query: SpinsQuery }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function hrefFor(patch: Partial<SpinsQuery>) {
    return `${pathname}${spinsQueryString(query, patch)}`;
  }

  function go(patch: Partial<SpinsQuery>) {
    const href = hrefFor(patch);
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  function intent(patch: Partial<SpinsQuery>) {
    router.prefetch(hrefFor(patch));
  }

  useEffect(() => {
    for (const report of SPINS_REPORT_KINDS) {
      router.prefetch(hrefFor({ report }));
    }
    for (const weeks of SPINS_PERIOD_WEEKS) {
      router.prefetch(hrefFor({ weeks }));
    }
    for (const region of regionKeys) {
      router.prefetch(hrefFor({ region: region as RegionKey }));
    }
    for (const scope of SPINS_SCOPES) {
      router.prefetch(hrefFor({ scope }));
    }
  }, [pathname, query, router]);

  return (
    <div className="sticky top-16 z-10 -mx-4 mb-6 border-b border-line bg-foam/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="flex flex-col items-start gap-2.5">
        <div className="max-w-full overflow-x-auto">
          <SlideToggle
            label="Report"
            value={query.report}
            options={SPINS_REPORT_KINDS.map((report) => ({ id: report, label: reportLabel(report) }))}
            onIntent={(report) => intent({ report })}
            onChange={(report) => go({ report: report satisfies SpinsReportKind })}
          />
        </div>
        <div className="max-w-full overflow-x-auto">
          <SlideToggle
            label="SPINS period"
            value={String(query.weeks) as WeeksKey}
            options={weeksOptions}
            onIntent={(weeks) => intent({ weeks: Number(weeks) as SpinsPeriodWeeks })}
            onChange={(weeks) => go({ weeks: Number(weeks) as SpinsPeriodWeeks })}
          />
        </div>
        <div className="max-w-full overflow-x-auto">
          <SlideToggle
            label="Region"
            value={query.region}
            options={regionKeys.map((region) => ({ id: region, label: regionLabel(region) }))}
            onIntent={(region) => intent({ region: region as RegionKey })}
            onChange={(region) => go({ region: region as RegionKey })}
          />
        </div>
        <div className="max-w-full overflow-x-auto">
          <SlideToggle
            label="Brand scope"
            value={query.scope}
            options={SPINS_SCOPES.map((scope) => ({ id: scope, label: scopeLabels[scope] }))}
            onIntent={(scope) => intent({ scope })}
            onChange={(scope) => go({ scope: scope satisfies SpinsScope })}
          />
        </div>
      </div>
    </div>
  );
}