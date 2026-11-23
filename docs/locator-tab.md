# Leilo locations (store locator)

The company **Leilo locations** Google Sheet is the source of truth for retail doors in ARK. Sync it with the Google service account on **Sources**, same as the promotion calendar.

```env
GOOGLE_SHEET_LOCATOR_ID=
GOOGLE_SHEET_LOCATOR_GID=
GOOGLE_SHEET_LOCATOR_TAB=
```

Share the spreadsheet with the service account email. Run **Sync** on **Leilo locations (Google Sheet)** or **Sync configured sources**.

Expected columns include store name, address, city, state/region, channel (optional), latitude, and longitude. Header names are flexible (`Store`, `Store Name`, `State`, `Lat`, and so on).

After sync:

- **Auto-Updating Store Locator** lists all rows from the sheet.
- **Map** plots rows that have coordinates. Until the first sync, the map falls back to the older Closeby snapshot from leilo.com.

The public Find Us map on leilo.com is separate; ARK uses this sheet when it is wired.