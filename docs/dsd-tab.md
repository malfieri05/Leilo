# DSD tab

This tab is DSD partners’ sales **through** to retailers. Upload each partner’s CSV on Sources and type that partner’s name. ARK stores the name as a stable slug, so “Gold Coast” and “gold coast” stay one distributor.

Leilo’s Shopify invoice **to** a DSD partner stays on Sales Overview. It does not appear here.

Do not store portal passwords in the repo. MexCor and DSD Link logins stay in a password manager. Encompass stays a file upload until PartnerLink exists.

## Columns the file can use

- Retailer: Account, Store Name, Customer, Retailer, Chain, Store
- State: State, Region, Ship State
- Date: Ship Date, Shipped Date, Invoice Date, Order Date, Date
- SKU: SKU, Item Code, Item, UPC
- Description: Product, Description, Item Description
- Dollars: Revenue, Sales Dollars, Dollar Sales, Dollars, Amount, Extended Price, Total
- Cases: Cases Shipped, Cases Ordered, Cases
- Units: Units, Qty Shipped, Quantity, Qty, Eaches

Dollars win. If the file has units only, a can is $2.99 and a stick is $1.50. A case with no dollars is 12 cans, or 24 cans when the SKU says 4-pack.

Industry Type comes from a HubSpot company with the same retailer name. A blank stays **Needs a type**.

## Still open

Writing retailer name, address, Industry Type, and the order back to HubSpot. Partner-specific file layouts. Scheduled email or portal pulls.
