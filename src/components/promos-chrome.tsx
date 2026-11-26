"use client";

import { useSearchParams } from "next/navigation";
import { PromosFilters } from "@/components/promos-filters";
import { parsePromoQuery, type PromoQuery } from "@/lib/sources/promo-model";

export function PromosChromeLive() {
  const search = useSearchParams();
  const input: Record<string, string> = {};
  search.forEach((value, key) => {
    input[key] = value;
  });
  return <PromosChrome query={parsePromoQuery(input, new Date())} />;
}

export function PromosChrome({ query }: { query: PromoQuery }) {
  return <PromosFilters query={query} />;
}