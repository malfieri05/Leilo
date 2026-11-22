# UNFI

UNFI is not turned on as a live distributor yet. When a file arrives, this tab shows UNFI’s sales through to retailers. It does not show Leilo’s invoice to UNFI. That invoice stays on Sales Overview as Shopify orders with ordering method UNFI and direction `to`.

Sales rows use `source = 'unfi'` and `direction = 'through'`. The metrics match the KEHE tab:

- UNFI Total Locations
- UNFI Total Revenue
- UNFI SKUs Carried
- UNFI Total PODs
- UNFI PODs by SKU
- UNFI Revenue by Product Type
- UNFI Revenue by SKU
- UNFI Revenue by Industry Type

Period and region filters are the same as Sales Overview. Industry type comes from the retailer name match to HubSpot, then the same buckets as KEHE. Product type uses the SKU family map.

## Import

On Sources, choose UNFI and **Chains and Stores that ordered an Item**. Stock status is not wired for UNFI.

Column names follow [KEHE Connect columns](kehe-connect-columns.md) until UNFI publishes its own export. If the file has units or cases and no shipped dollars, revenue uses $2.66 per can, the same fallback as KEHE, until a UNFI price is supplied.

Account and order ids are namespaced with `unfi`, so the same store and SKU can exist on both distributors.
