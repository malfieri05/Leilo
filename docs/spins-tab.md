# SPINS Data

Monthly category extracts. Each release can be twelve files: Brand Rank, Item Rank, and the Sprouts item matrix, each for 4, 12, 24, and 52 weeks.

## Live path: Google Drive (recommended)

Weston’s team exports from the SPINS portal into Google Drive. Sales HQ syncs **two folders** with the same service account used for other Google Sheets:

| Folder | Purpose |
|--------|---------|
| **SPINS → SPINS Data** | Working exports (Item Rank, 4 week, category decks, etc.) |
| **SPINS Data → SPINS ARK DATA** | Curated sheets for ARK (e.g. date-stamped brand rank files) |

1. Enable **Google Drive API** in the Leilo GCP project.
2. Share **both folders** with `leilo-ark-sheets@…` as **Viewer**.
3. Set `GOOGLE_SERVICE_ACCOUNT_JSON`. Folder ids default to Leilo’s ids when unset (`GOOGLE_DRIVE_SPINS_FOLDER_ID`, `GOOGLE_DRIVE_SPINS_ARK_FOLDER_ID`, or `GOOGLE_DRIVE_SPINS_FOLDER_IDS`).
4. On **Sources**, run **Sync** on **SPINS**.

Each spreadsheet in either folder is classified by filename (`Item Rank`, `4 week`, `brand rank`, `Sprouts`, etc.). The newest file wins when two sheets map to the same report/window (`brand-rank:12w`, etc.). **Raw Exports** and other subfolders are not crawled unless you add their folder id explicitly.

If naming is irregular, set `GOOGLE_DRIVE_SPINS_MANIFEST` to a JSON array of `{ fileId, report, weeks, name }`.

## Fallbacks

- **File upload** on Sources still works per report and week window.
- **Data Access API** (`SPINS_API_KEY`, `SPINS_API_URL`) remains optional when MyExtracts is purchased.

## What stays in the view

4-packs are left out. So is any row whose dollar sales are under $2,000. Those rows are counted as held out on the latest file for the selected report and window.

## Competitors

The comparison list is the brand set Weston pulls against Leilo: Hiyo, Recess, Kin Euphorics, Ghia, De Soi, Kava Haven, Melo, Kaviva, Brez, Little Saints, The NA Bev Co, Parch, Free AF, Aplos, Three Spirit, Edna's, Naked Life, Mingle, Trip, Moment, Mocktail Club, and Luna Bay.

That list is not the Lead Generation competitor list. Lead Generation stores names for a later store-locator scrape. This tab only compares scan dollars.

## Region

Nationwide, California, and the Southeast use the same state lists as the other tabs when the file has a geography column. Rows with a blank geography stay visible. A file with no geography ignores the region filter.

## Still open

Column names will be tightened after the first real SPINS export from Drive. A scheduled cron on Vercel can call the same connector when Weston wants nightly refresh.