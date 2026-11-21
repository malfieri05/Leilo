# Revenue truth (Milestone 1)

Canonical Shopify wholesale rules live in `src/lib/sources/revenue-classification.ts`. Sales Overview, Direct, and `revenueByOrderingMethod()` use the same filters.

## Source of truth (current)

- **Revenue reporting:** `orders` where `source = 'shopify'` only. HubSpot orders are not included until dedupe rules exist.
- **Ship date:** `processed_at` else `created_at` on ingest (unchanged).

## Sales to vs Direct

| Intent | `ordering_method` | `direction` | In Direct KPI |
| --- | --- | --- | --- |
| Leilo → retailer (confident) | `Direct` | `direct` | Yes, when `exclude_from_direct = false` |
| Leilo → KEHE / UNFI / DSD | channel name | `to` | No (channel KPI) |
| Ambiguous / needs review | `Unclassified` | `direct` or `to` | No |
| Cancelled, sample, POS, merch | `Unclassified` | — | No (`revenue` 0 or tag excluded) |

**Confident Direct signals:** `#B-` / `B-` wholesale order name, whole tag `direct`, or note/tag containing “direct” without “distributor”.

**Not assumed Direct:** untagged orders without a B2B order name.

## Non-revenue tags (documented)

Whole-tag match: `sample`, `pos`, `merch`, `merchandise` (from client context). Other tags may still count in revenue until rules are confirmed.

## Client clarifications still open

- Whether some untagged wholesale orders should default to Direct without `#B-`.
- Full list of POS/merch tag variants in production Shopify.
- Whether sample-tagged orders should appear on a separate tracking view with dollar amounts visible.

Re-sync Shopify on Sources after rule changes so `orders` rows pick up new classification.