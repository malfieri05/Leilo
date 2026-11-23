# Promotion Calendar

KEHE and UNFI promotions for 2025–2027. The live source is the Google Sheet: set `GOOGLE_SHEET_PROMO_ID` (and usually `GOOGLE_SHEET_PROMO_GID` from the tab URL) in `.env.local`, share the doc with the service account, then **Sync Google Sheets** on Sources. A CSV upload under **Promotion calendar** still works as a fallback and replaces the stored calendar.

The sheet is a matrix: one row per account, one column per month. The tab unpivots each filled cell into a promotion. The vendor legend rows at the bottom are not events.

## Views

**Agenda** is the default. Pick a year, a month or all months, and a channel. The bar chart counts promotions in that year. The table lists the account, distributor, any dates found in the cell, the summary, and a status.

**Matrix** is the same grid as the sheet, with the selected month highlighted.

## Channels

Distributor text sets the channel. KEHE-only rows are KEHE. The UNFI distributor row is UNFI. A distributor that names both, such as MOM’s Organic Market, stays visible on both the KEHE and UNFI filters. Mexcor and LAD rows are DSD. Thrive Market is Direct.

## Status

Cancelled, hold, submitted, and planned come from the words in the cell. Everything else is active. A promotion on this tab is a planned window. It is not revenue until an order ships inside that window.

## Still open

KEHE independent-east and independent-west emails are not parsed. The calendar is not joined to sales-through dollars yet. There is no automatic refresh on every cell edit; sync Google Sheets after material updates.
