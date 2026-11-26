"use client";

import { useSearchParams } from "next/navigation";
import { SpinsFilters } from "@/components/spins-filters";
import { parseSpinsQuery, type SpinsQuery } from "@/lib/sources/spins-model";

export function SpinsChromeLive() {
  const search = useSearchParams();
  const input: Record<string, string> = {};
  search.forEach((value, key) => {
    input[key] = value;
  });
  return <SpinsChrome query={parseSpinsQuery(input)} />;
}

export function SpinsChrome({ query }: { query: SpinsQuery }) {
  return <SpinsFilters query={query} />;
}