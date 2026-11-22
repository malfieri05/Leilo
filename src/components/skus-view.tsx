"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/panel";
import type { SkuOverview, SkuRow } from "@/lib/sources/sku-overview";

const formats = [
  { id: "all", label: "All formats" },
  { id: "single", label: "Single" },
  { id: "four-pack", label: "4-pack" },
  { id: "stick", label: "Sticks" },
] as const;

export function SkusView({
  report,
}: {
  report: Extract<SkuOverview, { state: "ready" }>;
}) {
  const [category, setCategory] = useState("all");
  const [format, setFormat] = useState<(typeof formats)[number]["id"]>("all");
  const [search, setSearch] = useState("");
  const categories = ["all", ...report.summary.byCategory.map((item) => item.category)];
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return report.rows.filter((row) => {
      if (category !== "all" && row.category !== category) return false;
      if (format !== "all" && row.format !== format) return false;
      if (!query) return true;
      return [row.description, row.unitUpc, row.caseUpc, row.gtin, row.keheEsn, row.itemNumber]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [report.rows, category, format, search]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        {report.effectiveDate ? `Pricelist effective ${report.effectiveDate}. ` : "No effective date on the latest file. "}
        Upload a new CSV on{" "}
        <Link href="/sources" className="font-semibold text-heading underline">
          Sources
        </Link>
        .{" "}
        {report.sheetLink ? (
          <a href={report.sheetLink} className="font-semibold text-heading underline">
            Open the master sheet
          </a>
        ) : (
          "The Google Sheet id is not set, so this tab reads the uploaded file."
        )}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="SKUs" value={String(report.summary.total)} />
        <Stat label="Single cans" value={String(report.summary.singles)} />
        <Stat label="4-packs" value={String(report.summary.fourPacks)} />
        <Stat label="Sticks" value={String(report.summary.sticks)} />
      </div>

      <Panel title="Standing case math" action="Reference">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card title="4-pack case" detail="24 cans." />
          <Card title="Single-can case" detail="12 cans." />
          <Card title="KEHE can" detail="$2.66 delivered unit on the single-can rows." />
          <Card title="DSD can / stick" detail="$2.99 a can and $1.50 a stick when a sales file has no dollars. This list shows the sheet’s DSD unit." />
        </div>
      </Panel>

      <Panel title="SKU list" action={`${rows.length} shown`}>
        <div className="mb-4 flex flex-wrap gap-2">
          <select
            aria-label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-[10px] border border-line bg-paper px-3 py-2 text-sm"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All categories" : item}
              </option>
            ))}
          </select>
          <select
            aria-label="Format"
            value={format}
            onChange={(event) => setFormat(event.target.value as (typeof formats)[number]["id"])}
            className="rounded-[10px] border border-line bg-paper px-3 py-2 text-sm"
          >
            {formats.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <input
            aria-label="Search SKUs"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, UPC, or KEHE number"
            className="min-w-56 flex-1 rounded-[10px] border border-line bg-paper px-3 py-2 text-sm"
          />
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted">
            {report.rows.length === 0 ? "Upload the master pricelist on Sources." : "No SKUs match those filters."}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((row) => (
              <SkuCard key={row.catalogKey} row={row} />
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Supplement facts" action="Not uploaded">
        <p className="text-sm text-muted">Panels to be added per SKU. Weston still needs the supplement facts files attached to this list.</p>
      </Panel>
    </div>
  );
}

function SkuCard({ row }: { row: SkuRow }) {
  return (
    <details className="rounded-[10px] border border-line px-4 py-3">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold text-heading">{row.description}</p>
          <p className="text-sm text-muted">{row.category}</p>
        </div>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
          <Fact label="KEHE" value={row.keheEsn} />
          <Fact label="Unit UPC" value={row.unitUpc} />
          <Fact label="GTIN" value={row.gtin} />
          <Fact label="Master pack" value={row.masterPack == null ? null : String(row.masterPack)} />
          <Fact label="Delivered case" value={money(row.deliveredCase)} />
          <Fact label="DSD unit" value={money(row.dsdUnit)} />
          <Fact label="MSRP" value={money(row.msrp)} />
          <Fact label="Size" value={row.unitSize} />
        </dl>
      </summary>
      <div className="mt-3 grid gap-2 border-t border-line pt-3 text-sm sm:grid-cols-3">
        <Fact label="FOB unit" value={money(row.fobUnit)} />
        <Fact label="FOB case" value={money(row.fobCase)} />
        <Fact label="Delivered unit" value={money(row.deliveredUnit)} />
        <Fact label="Case UPC" value={row.caseUpc} />
        <Fact label="Pallet" value={row.logistics.pallet ?? null} />
        <Fact label="Case weight" value={row.logistics.caseWeight ?? null} />
        <Fact label="Shelf life" value={row.logistics.shelfLife ?? null} />
        <Fact label="Date coding" value={row.logistics.dateCoding ?? null} />
        <Fact label="Case cube" value={row.logistics.caseCube ?? null} />
      </div>
    </details>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="text-heading">{value || "—"}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[10px] border border-line bg-paper p-5">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-3 font-display text-3xl text-heading">{value}</p>
    </article>
  );
}

function Card({ title, detail }: { title: string; detail: string }) {
  return (
    <div>
      <p className="font-semibold text-heading">{title}</p>
      <p className="text-sm text-muted">{detail}</p>
    </div>
  );
}

function money(value: number | null) {
  if (value == null) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}
