# SKU Data / Information

The B2B master price list. Upload the distributor pricelist CSV on Sources and choose **SKU master list**. Excel files need to be saved as CSV first. A new upload replaces the previous list. Matching GTINs update in place.

The Google Sheet id (`GOOGLE_SHEET_SKU_ID`) only adds an “open the master sheet” link. Syncing that sheet is a later step.

## What the file contains

The 2026 export has a title, an effective date, then a two-row header. Section labels such as RTD cans and Powder apply to the product rows under them. The vendor and remittance block at the bottom is not imported. Helper rows such as inner-UPC notes are not products.

Each product keeps the KEHE enterprise number, unit UPC, case UPC, GTIN, pack counts, FOB, delivered, and DSD prices, MSRP, and the case logistics (weight, cube, pallet, shelf life, date coding).

## How this differs from the consumer catalog

[leilo.md](leilo.md) lists the website flavor codes, such as FG-12-RH. This tab lists the distributor identifiers: UPC, GTIN, and KEHE enterprise number. They are the same drinks, named for wholesale.

## Supplement facts

Weston still needs supplement facts panels added per SKU. The tab reserves that section. No files are stored yet.

## Standing case math

A single-can case is 12 cans. A 4-pack case is 24 cans. When a sales file has units and no dollars, KEHE still uses $2.66 a can and DSD uses $2.99 a can or $1.50 a stick. Those fallbacks live on the sales tabs. This list shows the prices printed on the sheet, including the delivered unit of $2.66 on the single cans.
