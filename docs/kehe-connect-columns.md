# KEHE Connect columns

KEHE has no supplier API in this app. Export the report from KEHE Connect as CSV (Excel workbooks must be saved as CSV first), then import it on Sources with the matching report type. Do not store Connect passwords in the repo.

## Chains and Stores that ordered an Item

Report type: `sales-through`. Supplier and brand: Leilo. Use shipped dollars when the file has them.

Recognized headers (any one in each group):

- Retailer: Chain, Store Name, Store, Customer, Retailer, Account
- State: State, Region, Ship State
- Date: Ship Date, Shipped Date, Invoice Date, Date
- SKU: SKU, Item Code, Item, UPC
- Description: Product Description, Item Description, Description, Product
- Shipped dollars: Shipped Revenue, Shipped Dollars, Shipped $, Shipped Sales, Revenue, Sales Dollars, Dollar Sales, Dollars, Amount, Extended Price
- Units: Units Shipped, Eaches Shipped, Cans Shipped, Quantity Shipped
- Cases ordered: Cases Ordered, Qty Ordered, Ordered
- Cases shipped: Cases Shipped, Qty Shipped, Shipped Cases

If shipped dollars are missing, revenue is units times $2.66, or cases shipped times 12 cans times $2.66.

A monthly pivot also imports as sales-through. That file has Retailer Name, Main Store, Sub Store, and SKU, then a dollar column for each month under a year heading. Each nonzero month becomes one shipment on the first of that month. The store name supplies the state (`MONTEREY, CA`). The UPC inside the SKU label, such as `(850031385009)`, is the SKU. Pivot total rows are skipped. This file has no cases ordered or cases shipped, so fill rate stays empty.

## Stock Status Report

Report type: `stock-status`. Enterprise supplier: Leilo. The export may start with a few title rows. The parser uses the first row that contains both `DC` and `Weeks on Hand`.

Recognized headers:

- DC
- UPC or SKU
- Product Description
- Vendor Case Pack
- Quantity On Hand
- Quantity On Purchase Order
- Weeks on Hand
- Weeks on PO
- Quantity on Sales Order

A row with a DC and no UPC is stored as a DC subtotal. In the grouped export the DC name is only on that subtotal line (`Aurora, CO`), and the SKU lines under it leave DC blank. Those SKU lines keep the DC above them. City names map onto the DC codes below.

SKU rows are colored on the KEHE tab: red under 3 combined weeks, orange under 5, yellow under 7, green when a weeks figure is above 8 and the sales order is more than twice implied weekly demand.

DC codes: 01 St. Augustine, 12 Aurora, 14 Phoenix, 16 Bloomington, 18 Romeoville, 19 Dallas/Fort Worth, 25 Portland, 27 North East Maryland, 31 Miami, 33 Stockton, 41 Chino, 55 Douglasville.
