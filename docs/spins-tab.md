# SPINS Data

Monthly category extracts. Each release can be twelve files: Brand Rank, Item Rank, and the Sprouts item matrix, each for 4, 12, 24, and 52 weeks.

Upload them on Sources. Choose the report and the week window. The connection is stored as a slug such as `brand-rank:12w`. The Data Access API stays optional (`SPINS_API_KEY` and `SPINS_API_URL`). This tab does not log into the SPINS portal.

## What stays in the view

4-packs are left out. So is any row whose dollar sales are under $2,000. Those rows are counted as held out on the latest file for the selected report and window.

## Competitors

The comparison list is the brand set Weston pulls against Leilo: Hiyo, Recess, Kin Euphorics, Ghia, De Soi, Kava Haven, Melo, Kaviva, Brez, Little Saints, The NA Bev Co, Parch, Free AF, Aplos, Three Spirit, Edna's, Naked Life, Mingle, Trip, Moment, Mocktail Club, and Luna Bay.

That list is not the Lead Generation competitor list. Lead Generation stores names for a later store-locator scrape. This tab only compares scan dollars.

## Region

Nationwide, California, and the Southeast use the same state lists as the other tabs when the file has a geography column. Rows with a blank geography stay visible. A file with no geography ignores the region filter.

## Still open

Column names will be tightened after the first real SPINS export. Portal login and scheduled pulls stay out until MyExtracts or the Data Access API is the path Weston wants.
