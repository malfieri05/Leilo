# Sample / Order Tracking

A shipment stays on this tab until 21 days after it is delivered. Lines that are still in transit stay until a delivery date arrives. Voided ShipStation shipments are hidden.

## POS tracking

ShipStation shipments joined to Shopify orders on the order name (`#B-…`, with or without the leading `#`). The Shopify tags must include `pos`, `merch`, or `merchandise` as a whole tag. Orders that also carry `sample` stay on Sample tracking instead.

## Sample tracking

Same join. The Shopify tag is `sample`.

## LTL tracking

Google Sheets sync reads `GOOGLE_SHEET_LTL_ID`. The tab name is `GOOGLE_SHEET_LTL_TAB`, which defaults to **Kehe**. Only column A / Order # values that start with `#B-` are stored. Bare `B-` rows are left out.

Status `Delivered` uses the Ship date as the delivery date and sets the 21-day window from that date. The Tracking cell is the link when it is a URL. PRO, then BOL, is the tracking number when the Tracking cell is a URL or blank.

## Sync

On Sources, sync Shopify, ShipStation, and Google Sheets. ShipStation needs `SHIPSTATION_API_KEY` and `SHIPSTATION_API_SECRET`. The sheet needs `GOOGLE_SERVICE_ACCOUNT_JSON` and `GOOGLE_SHEET_LTL_ID`, shared to the service account.
