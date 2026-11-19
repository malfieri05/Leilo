# B2B sales context

Conversation starter from Weston’s November 2026 write-up (`AI_Build_Goals_v4`). This is how he runs Leilo B2B sales today, and what he wishes a platform would show. It is not the product spec. Tab structure, what we build first, and which sources we connect are decisions we still make.

Logins from that write-up are not stored here. Systems are named. Credentials stay outside the repo.

Public brand and product notes live in [leilo.md](leilo.md).

## Who it is for

The people he named are Weston, Zak, James, Ivee, and other teammates. Permissions come later. He did not define roles.

## How orders actually happen

Four ordering methods: **Direct**, **DSD**, **KEHE**, and **UNFI**.

UNFI is not active yet. He expects that tab to mirror KEHE once it is.

The same sale can be counted two ways, and he wants those kept apart:

- **Sales to** a distributor is Leilo’s invoice to KEHE, UNFI, or a DSD partner. That is what Sales Overview uses.
- **Sales through** a distributor is that distributor’s sales on to retailers. That is what the KEHE, UNFI, and DSD sections use.

Direct is the retailer ordering from Leilo. Those orders live in HubSpot. Shopify also receives KEHE, UNFI, and DSD orders, so a Direct view has to filter those out. He filters DSD in HubSpot by Industry Type “Independent Distributor” or “Regional Distributor” when that company has sales. KEHE and UNFI orders are marked clearly in Shopify.

Every sales label should start with the ordering method, for example “Direct Total Revenue” or “KEHE Total PODs.”

## Where he checks data today

| System | What he uses it for |
| --- | --- |
| HubSpot | Company properties and orders. Customer Type, Industry Type, and Ordering Method live here. Direct sales are read from HubSpot orders. DSD results should be written back here. |
| Shopify | Direct orders, plus distributor orders that must be excluded. Sample, POS, and merch tags matter for tracking. |
| KEHE Connect | Fill rate and stock status. Reports he named: “Chains and Stores that ordered an Item” and “Stock Status Report,” supplier and brand set to Leilo. He wants this daily, or weekly at minimum, and he wants shipped revenue. |
| UNFI | Not turned on. Same shape as KEHE when it is. |
| SPINS | Monthly category data in 4-, 12-, 24-, and 52-week windows. |
| DSD Link, Encompass, email, spreadsheets | Each DSD partner reports differently. Some are portals, some are scheduled emails, some are a manual ask. |
| ShipStation | Sample and in-transit order tracking. |
| Spreadsheets | SKU and price list, KEHE stock-status prompt, LTL bill-of-lading sheet, and the store-locator sheet. Those links were in his doc; they are not copied here. |

### DSD partners and how reports arrive

He tracks the exact cadence on a separate sheet. From the write-up:

- Craft Collective Homegrown and Elite Brands: DSD Link (Elite also has a manual report).
- LAD: listed, method not spelled out.
- Briggs: monthly email.
- INFD (formerly SMNR): weekly financial-report email.
- Premier Island Brokerage: he requests the report.
- Gold Coast: monthly email, subject like “Leilo - MONTH YEAR - Gold Coast Sales Report.”
- MexCor: Encompass.
- AlaBev: weekly email, subject “AlaBev Weekly Sales.”
- 6th City, Travis Doupe, Monica in Louisiana, James in MN, David Bowers / Bellwether: he requests the report.
- Romano Beverage, Empire Beverage, John Lenore: still marked unsure.

DSD fields he wants pushed into HubSpot: retailer name, address, Industry Type, and the order (date, SKUs, revenue).

## Definitions he already uses

**Customer type** is a HubSpot company property, judged from today off the account’s most recent order from any method. If they are Active through KEHE and Past in Direct, they are Active. The point is whether the product is likely still on the shelf.

- Active: ordered within 90 days.
- At Risk: last order more than 90 days ago and up to 150.
- Past customer: last order more than 150 days ago.
- Prospect: samples sent, never ordered.

**Time.** A sale lands in a period by ship date. Lifetime and All Time mean the full history he has. YTD vs prior YTD compares the same dates in each year (his example was Jan 1–Nov 16 against that span last year).

**Revenue** is the top-line number the source already shows. When a source gives units or cases instead of dollars, he converts with:

- KEHE: $2.66 per can (KEHE’s price to the retailer).
- DSD: $2.99 per can (Leilo wholesale) and $1.50 per stick.
- A 4-pack case is 24 cans (six 4-packs). A single-can case is 12 cans.
- Full SKU detail is supposed to live on a separate sheet.

**POD.** One account times one SKU sold in the selected period.

**Order.** Direct and DSD orders have a date, and each dated order counts as one. KEHE arrives weekly, so a week with an order counts as one. If KEHE ever arrives daily, a day with an order counts as one.

**Account language.**

- Door: one brick-and-mortar location with an address that carries the product.
- Industry Type: retailer type. HubSpot custom property `industry_type`. Never the standard Industry field. “The independent grocery channel” means filter Industry Type. If it is blank, either guess and fix it in HubSpot or flag it for him.
- Ordering Method: DSD, Direct, UNFI, or KEHE. HubSpot company property.
- Region: always the retailer location’s address.
- New account: that account’s first order ever, across any method.
- Anchor account: a retailer large enough to force a distributor to carry the brand in a territory.
- DSD, in his usage, includes every partner on the DSD list, brokers and individuals included.
- “All of our SKUs” for upsell means every can flavor and every drink mix. Kava flakes and kava extract are excluded from that upsell list.
- Product types he called out on the overview: RTDs/cans, kava extract, kava flakes, kava powders.

**KEHE extras.** Fill rate is cases shipped divided by cases ordered. Stock-status colors and which DC/SKU pairs count as problems are defined in a prompt he already uses with Claude, not in this note.

**Leads.**

- Lookalike: similar Industry Type, same region, carries a competitor.
- High-volume, for display shippers: top 30% of its Industry Type, or top 30% of all Active customers, by revenue in the selected period.
- Competitor lists stay separate: the SPINS comparison list, and the store-locator scrape list.

**SPINS display rules he stated.** SKU or brand level. Drop Leilo 4-packs and any SKU under $2,000. Reports he pulls each release: Brand Rank and Item Rank for 4, 12, 24, and 52 weeks, plus a Sprouts item matrix for those same windows. Competitor comparison brands he listed: Hiyo, Recess, Kin Euphorics, Ghia, De Soi, Kava Haven, Melo, Kaviva, Brez, Little Saints, The NA Bev Co, Parch, Free AF, Aplos, Three Spirit, Edna’s, Naked Life, Mingle, Trip, Moment, Mocktail Club, Luna Bay.

**Promotions.** KEHE national deals, MCBs, and retailer-specific promotions. He also watches KEHE emails for independent-east and independent-west and wants account, SKUs, revenue, and discount percent summarized. UNFI promotions are the same idea, not active yet.

**Tracking.** An order stays on the tracking view until 21 days after delivery. POS and merch are Shopify tags. Samples are the Shopify tag `sample`. LTL tracking comes from a spreadsheet; only the “BOLs for TLs” tab, and only rows whose order id starts with `B-` or `#B-`.

**Store locator, his version.** Doors that ordered in the last 180 days. He wants it refreshed weekly, but only after Direct, KEHE, UNFI, and DSD are all flowing. That is a different rule from the public Find Us map already in this app, which is a snapshot of the live locator.

## Filters he wants on everything

- Region: Nationwide, California, and the Southeast (FL, GA, SC, NC, MS, TN, AL).
- Dates: MTD, YTD, YTD vs the same dates last year, a custom range, and All Time.

## His wishlist, not our scope

He sketched twelve areas. Treat them as a menu.

1. **Sales Overview.** Health at a glance for Nationwide, California, and the Southeast. All four methods combined, distributor figures as sales *to* the distributor. Revenue by method, SKU, and product type. Retention: accounts that ordered, one-and-done or two-and-done past 90 days, share that ordered 3+ times in the past year, share of last year’s buyers who ordered in the last 90 days, share of two-year buyers who are Active, plus lifetime / active / at risk / past / prospect counts. Tier bands inside a segment (top 0–5%, 5–10%, 10–25%, 25–50% of revenue) so he can see which retailers matter. For now those tiers exclude KEHE, DSD, and UNFI. Industry Type counts and revenue, with blanks flagged.
2. **KEHE.** Sales through to retailers. Locations, revenue, SKUs carried, PODs, PODs by SKU, revenue by product type, SKU, and Industry Type. Fill rate for any date range. A colored DC-by-SKU stock chart. New first orders, account health, and upsell inside current accounts.
3. **Direct.** The metrics above, from HubSpot, with distributor orders removed. Also how many accounts ordered in 30-, 60-, and 90-day windows.
4. **DSD.** Same metrics, for all of DSD or one distributor, plus revenue by distributor. Ingest the messy partner reports and write them to HubSpot.
5. **Lead generation.** Three lists, each split into KEHE, Direct, and DSD. At Risk and Past, sorted by revenue. Existing customers missing SKUs (not flakes or extract), with the high-volume cut called out for display shippers. New leads from competitor store locators, starting with Kaviva, Melo, Kava Haven, and Recess, plus a way for him to add competitors later, and lookalikes.
6. **SPINS.** Whatever cut of a SPINS report he needs, at SKU or brand level, with the filters above.
7. **Brand kit.** Digital assets and point-of-sale designs in one place.
8. **SKU data.** Master list and prices, linked from a sheet.
9. **Promotion calendar.** KEHE and, later, UNFI. A calendar or chart, plus the emailed promo summaries.
10. **UNFI.** Same data points as KEHE, sales through to retailers, when the relationship is on.
11. **Sample and order tracking.** ShipStation, the Shopify tags, and the LTL sheet. Drops off 21 days after delivery.
12. **Store locator.** Weekly update of doors ordered in the last 180 days, fed from all four methods, then written to his Google Sheet.

## He already marked these as undefined

- How a multi-location retailer or a chain counts as one account.
- What “account health” means.
- What makes a background lead a good opportunity.
- Whether Shopify `sample` tags import into HubSpot.
- How often each area refreshes.
- Which SPINS views belong on the dashboard.

## What to use this for

Use it to understand the current mess and his vocabulary: to vs through, POD, customer type, Industry Type, ordering method, door, anchor.

Do not use it to freeze the information architecture, the first build slice, or which systems get connected.
