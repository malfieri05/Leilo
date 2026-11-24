# SPINS Google Drive inventory (Leilo)

Synced folders: **SPINS Data** and **SPINS ARK DATA** (service account read). Pinned file ids live in `src/lib/sources/spins/drive-catalog.ts`.

## Loaded after Sync (catalog + auto-match)

| Slot | File | Folder | Notes |
|------|------|--------|--------|
| Brand rank · 4w | `11-1-26 brand rank 4 week.xlsx` | ARK DATA | Pinned (~3.5k rows) |
| Brand rank · 12w | `11-1-26 brand rank 12 week.xlsx` | ARK DATA | Pinned |
| Brand rank · 24w | `11-1-26 brand rank 24 week.xlsx` | ARK DATA | Pinned |
| Brand rank · 52w | `11-1-26 brand rank 52 week.xlsx` | ARK DATA | Pinned |
| Item rank · 12w | `Leilo v Category Item Rank 12w.xlsx` | SPINS Data | Pinned (~82 rows). **Not** the `8.20.26` summary (16 rows). |

## Not on Drive yet (7 / 12 windows)

Add exports to **SPINS ARK DATA** with clear names, then re-sync on Sources.

| Slot | Suggested filename pattern |
|------|----------------------------|
| Item rank · 4w | `… item rank 4 week.xlsx` |
| Item rank · 24w | `… item rank 24 week.xlsx` |
| Item rank · 52w | `… item rank 52 week.xlsx` |
| Sprouts matrix · 4w | `… sprouts matrix 4 week.xlsx` (or `sprouts item matrix`) |
| Sprouts matrix · 12w | `… sprouts matrix 12 week.xlsx` |
| Sprouts matrix · 24w | `… sprouts matrix 24 week.xlsx` |
| Sprouts matrix · 52w | `… sprouts matrix 52 week.xlsx` |

## On Drive but not used for sync

| File | Why skipped |
|------|-------------|
| `SPINS Item Rank Summary (Postcard data)` | Summary / postcard, not full rank export |
| `Investor Spins Data 7/29/26` | Investor deck, not portal extract |
| `SPINS Data 7/12 (12w and 4w)` | Date in name, no single report+week |
| `SPINS - LEILO Brand Rank.xlsx` | No week window in filename (~7 rows) |
| `SPINS L4 7-12-26 Brand Rank.xlsx` | Superseded by ARK brand rank 4w |
| `12 week data (Leilo v Competitors)` | Superseded by ARK brand rank 12w |
| `SPINS 4 week 5/17/2026` / `SPINS: Rolling 4 Week` | Superseded by ARK brand rank 4w |
| `Leilo v Category Item Rank 12w (8.20.26).xlsx` | Summary; catalog pins the non-dated workbook |
| `Leilo Natural Channel data` | No report/week pattern |
| `Total Spirits and Beer L52 Weeks…` | Category outside SPINS tab scope |
| **Raw Exports** (subfolder) | Not scanned unless folder id is added |
| **SPINS ARK DATA** (subfolder entry in parent list) | Folder shortcut only |

## Overrides

- **Repo catalog:** edit `SPINS_DRIVE_CATALOG` to pin a `fileId` per slot.
- **Env manifest:** `GOOGLE_DRIVE_SPINS_MANIFEST` replaces auto-match entirely when set.
- **Re-sync:** Sources → SPINS → Sync after new files land.

## File ids (for manifest edits)

```
11-1-26 brand rank 4 week.xlsx     1srodiPINTMu7DBa7Q1bP_kefqq-cmG_L
11-1-26 brand rank 12 week.xlsx    1lAXW9JY5waOjY3PsWNpdtm7FhA6dXCPr
11-1-26 brand rank 24 week.xlsx    1hlc2ET-QP0Zyai3ZaV_Xad0a04wFJRLW
11-1-26 brand rank 52 week.xlsx    1MaoQbwfnvF87m5t2x_sg0OGnDeH64CbZ
Leilo v Category Item Rank 12w    1deGbCEqWBq9ss_gSWUpjZ28w_4gNxoXa
Leilo v Category Item Rank 12w (8.20.26)  1nCGCmeROSADnSbQbTe7eBEcDCqOjsoUC
```