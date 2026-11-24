# Revenue truth (Milestone 1)

Canonical Shopify wholesale rules live in `src/lib/sources/revenue-classification.ts` and `src/lib/sources/sales-to-registry.ts`. Sales Overview, Direct, and `revenueByOrderingMethod()` use the same filters.

## Source of truth (current)

- **Revenue reporting:** `orders` where `source = 'shopify'` only. HubSpot orders are not included until dedupe rules exist.
- **Ship date:** `processed_at` else `created_at` on ingest (unchanged).
- **Shopify scope:** The Leilo ARK app needs `read_all_orders` for full history; sync paginates up to 30k orders per pull.

## Sales to vs Direct

| Intent | `ordering_method` | `direction` | In Direct KPI |
| --- | --- | --- | --- |
| Leilo → retailer (confident) | `Direct` | `direct` | Yes, when `exclude_from_direct = false` |
| Leilo → KEHE / UNFI / DSD | channel name | `to` | No (channel KPI) |
| Ambiguous / needs review | `Unclassified` | `direct` or `to` | No |
| Cancelled, sample, POS, merch | `Unclassified` | — | No (`revenue` 0 or tag excluded) |

### Classification order (Shopify ingest)

1. Cancelled and non-revenue tags (sample, POS, merch).
2. **Ship-to identity:** Shopify customer name and shipping company matched against `sales-to-registry.ts` (ARK Brain distributor list).
3. Tag/note keywords (`kehe`, `unfi`, `dsd`, `encompass`) as fallback.
4. **Confident Direct:** `#B-` / `B-` wholesale order name, whole tag `direct`, or note/tag containing “direct” without “distributor”.
5. Otherwise **Unclassified** (excluded from Overview method totals).

## Sales Overview enrichment

- **Industry Type / Customer Type:** Shopify account first, then HubSpot company matched by name (same pattern as Direct).
- **Account health cohorts:** Retailer accounts only; KEHE, UNFI, and DSD partner names from the registry are excluded.

## Non-revenue tags (documented)

Whole-tag match: `sample`, `pos`, `merch`, `merchandise` (from client context). Other tags may still count in revenue until rules are confirmed.

## Still open

- “Other wholesale buyers at distributor pricing” in ARK Brain — not on the DSD registry; ship-to rules treat them as Direct or Unclassified until listed.
- Full list of POS/merch tag variants in production Shopify.

Re-sync Shopify on Sources after rule changes so `orders` rows pick up new classification.