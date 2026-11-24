# DSD tab

This tab is DSD partners’ sales **through** to retailers. Leilo’s Shopify invoice **to** a DSD partner stays on Sales Overview.

## Live sync (Google Drive)

Share **ALL SALES REPORTS** with the ARK service account. Each **subfolder** is one DSD partner. Sync on Sources → **DSD partners** reads the **newest** spreadsheet or Excel file in each folder.

Default folder id (override with `GOOGLE_DRIVE_DSD_REPORTS_FOLDER_ID`): `1oaDSJkEOTiYO-61gbZFQx068Rff9eN1P`. Partner folders with no file yet are skipped; the tab still works for partners that have data.

Native **Google Sheets** work best. Excel (`.xlsx`) on Drive is also supported. Excel-only previews in Drive (not converted to Google Sheets) may fail — use **Save as Google Sheets** or upload CSV.

## Manual CSV

Upload each partner’s CSV on Sources and type that partner’s name. ARK stores the name as a stable slug.

Do not store portal passwords in the repo.

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
