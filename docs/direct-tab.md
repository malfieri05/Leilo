# Direct tab

Retailers ordering from Leilo. This draft reads Shopify wholesale orders on `leilosupply`. HubSpot companies supply Industry Type when the company name matches the Shopify account. HubSpot orders stay out until they can be deduped against Shopify. Nothing is written back to HubSpot yet.

Do not store HubSpot portal passwords in the repo. The connection uses `HUBSPOT_ACCESS_TOKEN`.

## What counts

An order is Direct when Shopify classified it as Direct, the direction is direct, it is not excluded, revenue is above zero, and the tags are not sample, POS, or merch. KEHE, UNFI, and DSD invoices are sales to the distributor and stay off this tab.

Industry Type is the Shopify account’s type when it is filled, otherwise the HubSpot company with the same name. A blank on both sides is **Needs a type**. Accounts whose resolved type is Independent Distributor or Regional Distributor are left out.

Nationwide includes warehouse accounts whose names contain KEHE or UNFI. California and the Southeast leave those accounts out, matching Sales Overview.

## Period and activity

Revenue, SKUs, PODs, and the breakdowns follow the same period and region filters as Sales Overview. Ship date places an order in the period.

The 30-, 60-, and 90-day account counts are rolling windows as of today. Changing MTD to YTD does not change them.

## Still open

- HubSpot Commerce orders, once the private app can read them.
- Pushing carried SKUs and account quality onto HubSpot company records.
- A tighter match than company name when Shopify and HubSpot names differ.
