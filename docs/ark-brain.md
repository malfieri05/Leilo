# **ARK Brain: Start Here**

The ARK Brain is the single source of truth behind the ARK dashboard, where all Leilo data is centralized. It holds the company facts, people, definitions, pricing assumptions, HubSpot property meanings and data-source rules that the dashboard (and anyone building or using it) should rely on. When a number on the dashboard needs an explanation, the answer should live here.

## **How to use this document**

* The whole document scrolls top to bottom. Each section starts on a new page; use the document outline (left panel) to jump to a heading.  
* Definitions here override anything older. If a definition changes, update it here first, then in the dashboard.  
* Yellow-highlighted text is a draft definition that still needs Weston's review.  
* Items still being decided are collected in **Open Items** at the end.  
* Logins, passwords, API keys and other credentials are intentionally **not** stored here. Keep them in the ARK system doc or a password manager.

## **Sections**

| Section | What it holds |
| ----- | ----- |
| Key Links | Important docs, sheets, folders and portals (promo calendar, store locator, marketing materials, SPINS data, legal opinion, sales reports) |
| Company Profile | Legal name, billing address, our story, kava basics, products, regulatory position |
| Leilo Team Members | Who is on the team, their roles and responsibilities |
| Sales Channels & Ordering Methods | The four ordering methods, sales to vs. through, regions |
| Distributors | Every distributor and DSD partner, market, pricing and how sales data arrives |
| Pricing Assumptions | Per-can prices to assume when converting data, by ordering method, checked against Shopify |
| Competitors | Competitor brands for SPINS comparisons and store locator scraping |
| Core Definitions | Business and data definitions, including Customer Type and Industry Type |
| HubSpot Company Properties | Definitions for every field on the left side of a HubSpot company record |
| Dashboard Tabs & Metrics | What each ARK dashboard tab is for and what it shows |
| Data Sources & Integrations | What each connected system is used for and how it is pulled |
| Open Items | Definitions and decisions still to confirm |

*Sources: ARK \- Leilo System (dashboard spec), leilo.com, HubSpot company record layout, Shopify order history, Leilo 2026 W-9. Last updated November 21, 2026\.*

# **Key Links**

Important Leilo documents, sheets, folders and portals referenced by the ARK system. Access to each link follows its own sharing settings.

## **Dashboard planning**

| Link | What it is |
| ----- | ----- |
| [ARK \- Leilo System](https://docs.google.com/document/d/1kkooH12Bs5Y746xI4eCSUFAbsAftaWl7IXesYCCzv7g/edit) | The full dashboard spec: tabs, metrics, data sources, tech stack |
| [ARK Brain (this doc)](https://docs.google.com/document/d/1kkLVGaMe3TMKWPnUMip-QlduTxkpUYd4zxNhdANcj70/edit) | Definitions and company knowledge behind the dashboard |

## **Sales and promotions**

| Link | What it is |
| ----- | ----- |
| [Promotion Calendar](https://docs.google.com/spreadsheets/d/1bQMlCdpWfiq5QgcyipdDxWDFsXh8ITgwuIs4pwp6-Jo/edit) | KEHE, UNFI and DSD promotions and discounts for the year (DSD promotions are housed in this same calendar). Updated in the sheet, displayed in the dashboard. |
| [Store Locator sheet](https://docs.google.com/spreadsheets/d/1CBCg5xH38-YWG1kJkJeCPCZj_cMBJeBmFJN9WQ4mqug/edit) | Feeds the public store locator  |
| [Public store locator](https://leilo.com/pages/find-us) | Consumer-facing Find Us page |
| [HubSpot Orders view](https://app.hubspot.com/contacts/21506788/objects/0-123/views/all/list) | Where Shopify sales  live in HubSpot |
| [Wholesale site](https://www.leilowholesale.com/) | B2B ordering site for retailers |
| [Leilo on Airgoods](https://airgoods.com/u/leilo) | Third-party wholesale platform; orders flow through Shopify |
| [Rep Rally](https://app.reprally.com/) | Third-party wholesale platform; like Airgoods, orders flow through Shopify |

## **Products and SKUs**

| Link | What it is |
| ----- | ----- |
| [Master Price/SKU List 2026 B2B](https://docs.google.com/spreadsheets/d/1CacmHR6cbRMVikps8fAKpsRNvzoXzoGc/edit?gid=1489136033#gid=1489136033) | The only current source for SKUs, UPCs, case packs, pricing and specs (the older master pricelist is outdated) |
| [SKU information sheet (from ARK spec)](https://docs.google.com/spreadsheets/d/1CacmHR6cbRMVikps8fAKpsRNvzoXzoGc/edit) | SKU data linked on the dashboard's SKU tab |

## **Marketing materials and brand**

| Link | What it is |
| ----- | ----- |
| [Marketing folder](https://drive.google.com/drive/folders/1lqmVLnkpYfi1kr6YG2qu-0FORdJY--pA) | Main marketing folder in the Leilo shared drive (includes Brand Assets) |
| [Brand Assets](https://drive.google.com/drive/folders/1rK86-J-4j85PNzPpu66fRGbaBwVosek5) | Logos and brand files |
| [POS / Merchandise](https://drive.google.com/drive/folders/1GeXud9UFlc6oUKb2miRGmScxkH2CDQXL) | Point-of-sale and merch designs |
| [Current POS & Merch (2025)](https://drive.google.com/drive/folders/1REsiXVn_XV7INMVhjSnMmmp8tsZPSn8t) | Current POS pieces and display proofs. POS inventory is tracked in Shopify. |
| [Brand Decks](https://drive.google.com/drive/folders/1_H3MGi3ohx8PfiTlFP0ziu_oDP9LeRMU) | Sales and brand presentation decks |
| [Leilo shared drive (top level)](https://drive.google.com/drive/folders/1SZq9vBaUWpoF4l9uOP2V6-Mwwob14yFR) | Root of the Leilo Google Drive |

## **Distributor and KEHE data**

| Link | What it is |
| ----- | ----- |
| [Distributor/DSD summary](https://docs.google.com/spreadsheets/d/1vrNYuOLVu6pjyX0YWzEolzDTnLJUZa7pjxfGkTThJSU/edit) | Every DSD partner’s contract status and terms: channel inclusions/exclusions, termination fee, KEHE/UNFI carve-out, territory, promo split, sampling, sign-on date, price per can and payment terms |
| [All DSD sales reports folder](https://drive.google.com/drive/folders/1oaDSJkEOTiYO-61gbZFQx068Rff9eN1P) | Every DSD partner's sales reports, one subfolder per distributor |
| [All Distributor Sales Data (combined sheet)](https://docs.google.com/spreadsheets/d/1nmcY1waPTeVzze5uP5ZoIiP3Xa3UwtFl7NZprEEyHzk/edit) | Every DSD report found so far, combined into one table (Jan 2025 onward) |
| [Distributor Sales Report Coverage](https://docs.google.com/spreadsheets/d/1Bxx1AzV37MeE1bda29N1XzPOtmbQrLgWgTnjfdamF7o/edit) | Which distributor-months we have and which are missing |
| [KEHE data (Excel)](https://docs.google.com/spreadsheets/d/1yJktDvRMk6alJVyaSDvTx3mv4vgCoObu/edit) | KEHE sales data file used for the KEHE tab draft |
| [KEHE Stock Status Report](https://docs.google.com/spreadsheets/d/1ps0wXg1Zi5JGnOIgmZ5OtBGpDvH4OufX/edit) | Inventory by SKU by KEHE DC |
| [KEHE stock status prompt](https://docs.google.com/document/d/17oTUc9ZWyb02XvbuF2LqCK5lg0LDfhkilFVA8OVMWEo/edit) | Prompt and color thresholds used to build the stock status chart |
| [KEHE Connect](https://connectsupplier.kehe.com/) | KEHE supplier portal (sales, fill rate and stock status reports) |
| [UNFI supplier portal](https://suppliers.unfi.com/) | Not yet activated |

## **DSD partner portals (Encompass)**

| Link | What it is |
| ----- | ----- |
| [Craft Collective Homegrown](https://craftcollectivedist.com/Home?DashboardID=100008) | CCHG portal; prior 90 days and monthly sales reports |
| [Elite Brands](https://elitebrandsco.com/Home?DashboardID=100008) | Reporting \> Saved Reports \> YTD Sales Comparison |
| [LAD](https://ladistco.encompass8.com/) | Los Angeles Distribution portal (also weekly MoM email) |
| [Mexcor](https://mexcor.encompass8.com/) | Mexcor portal (Supplier sales YTD) |

## **SPINS**

| Link | What it is |
| ----- | ----- |
| [SPINS Data folder](https://drive.google.com/drive/folders/1YQTeU98kn6_hbJYp9PfgUJ9fAlghcDse) | SPINS pulls, saved in dated subfolders (e.g. 11-20-26) |
| [SPINS login](https://welcome.spins.com/) | SPINS portal |

## **Operations**

| Link | What it is |
| ----- | ----- |
| [LTL tracking sheet](https://docs.google.com/spreadsheets/d/1viANVX4mkdJvGksUwdufslMZlLgyKTGj39HYR2V96Zo/edit) | Use the "BOLs for TLs" tab; B2B orders start with B- or \#B- |
| [SPS Commerce](https://auth.spscommerce.com/u/login/password) | Leilo's EDI provider (purchase orders) |
| [Neon Postgres console](https://console.neon.tech/) | ARK database |

## **Legal and regulatory**

| Link | What it is |
| ----- | ----- |
| [Legal Opinion Letter \- Use of Kava in Dietary Supplements (June 16, 2026\)](https://drive.google.com/file/d/1hZjS7yhYwTMPLZ2DWpSxw3xvePfPyQFK/view) | Greenberg Traurig opinion supporting Leilo's classification as a liquid dietary supplement |
| [Legality of Leilo Kava Products](https://drive.google.com/file/d/1_RWKR7hLCGQbuOouJY12-ZPVVXAi3mGy/view) | Summary of the legal status of Leilo's kava products |
| [Legal/Regulatory folder](https://drive.google.com/drive/folders/1VQDFdWex06ITXCHHwbsjRW-M4jCwoUSJ) | Google Drive folder with all of Leilo’s legal and regulatory documents |

# **Company Profile**

## **Company facts**

* **Legal name:** Leilo, Inc.  
* **Entity type:** C corporation  
* **Billing address:** 353 Lexington Ave, 4th Floor PMB201, New York, NY 10016 (per the 2026 W-9)  
* **Founded:** 2020  
* **What we sell:** Kava-based, non-alcoholic functional beverages: sparkling kava drinks in cans and single-serve kava drink mix sticks; also kava extract, kava flakes and kava powders for B2B  
* **Consumer website:** [leilo.com](https://leilo.com)  
* **Wholesale:** [leilowholesale.com](https://www.leilowholesale.com/); also [Airgoods](https://airgoods.com/u/leilo) and [Rep Rally](https://app.reprally.com/)  
* **Social:** Instagram, TikTok and Facebook: @drinkleilo  
* **Team email format:** firstname@leilo.com (shared inboxes include sales@drinkleilo.com and orders@leilo.com)

## **Our story**

Leilo started with founder Sol Broady's 2018 trip to the south coast of Fiji. There he befriended a local named Benji, who introduced him to his family and the village elders and welcomed him into a traditional kava ceremony that lasted several hours, with kava shared from a turtle-shell bowl and coconut shells. Sol found that kava left him relaxed, sociable and happy, and back in the U.S. he and Benji kept talking about bringing kava beyond the South Pacific. Years of research and development, a second trip to Fiji, and a first prototype followed, and that became Leilo.

Positioning line on the site: *From Pacific roots to modern calm*. Kava is presented as a roughly 3,000-year South Pacific ritual of sharing calm and connection.

## **Brand taglines**

* Kava Powered Relaxation  
* lay low. let loose.  
* Find your calm  
* America's \#1 Kava brand (site title claim)  
* Nature's calming social tonic   
* Kava-Powered Chill 

## **Kava basics (from Kava 101 on leilo.com)**

* Kava is a root-based drink from the South Pacific, traditionally made by grinding the root and mixing it with water. Islanders have used it for thousands of years to relax and socialize.  
* Kavalactones are kava's active compounds. There are 18, and most of the effect comes from six; different varieties have different mixes, so some feel more uplifting and others suit evening use.  
* The effect is described as mild ("chill but not overkill") and non-addictive; used to promote relaxation and mood.  
* Traditionally sourced from Fiji and Vanuatu; also grown in Tonga, Hawaii and other tropical regions.  
* Leilo uses noble kava that is third-party lab tested. Brewing and canning happen in an FDA-registered, GMP facility.

## **Current consumer product line (leilo.com)**

* **Sparkling kava cans:** Pina Colada, Lime Margarita, Raspberry Hibiscus, Moscow Mule, Blackberry Orange, Tangerine Mango  
* **Variety packs:** Variety Sampler, Classic Variety, Mocktail Variety  
* **Drink mix (single-serve sticks):** Lemon Lime, Berry, Orange  
* **Product claims:** Sugar free; designed to calm and promote relaxation  
* **Full SKU list, UPCs, case packs and pricing:** Master Price/SKU List 2026 B2B (see Key Links).

## **Product types (used in BTB dashboard reporting)**

* RTDs / Cans  
* Kava Powders (drink mix sticks)  
* Kava Extract  
* Kava Flakes

## **Regulatory and compliance position**

* Leilo products are classified as liquid dietary supplements under 21 CFR Part 111, per the [Greenberg Traurig legal opinion letter (June 16, 2026\)](https://drive.google.com/file/d/1hZjS7yhYwTMPLZ2DWpSxw3xvePfPyQFK/view).  
* Manufactured in an FDA-registered, GMP facility.  
* Required consumer disclaimers: statements have not been evaluated by the FDA; not intended to diagnose, treat, cure or prevent any disease; not for people under 18 or pregnant or breastfeeding women; do not combine with alcohol or driving; kava-containing supplements carry a rare risk of severe liver injury.  
* Some states add retail rules for kava (for example Utah's Specialized Product Retailer License).  
* Leilo carries product liability and workers' compensation insurance.

# **Leilo Team Members**

Every team email follows the format firstname@leilo.com.

| Name | Role | Responsibilities | Reports to | Email |
| ----- | ----- | ----- | ----- | ----- |
| Sol Broady | Founder & CEO | Company leadership and strategy; signs agreements |  | sol@leilo.com |
| Ethan Blattman | CFO | Finance and accounting |  | ethan@leilo.com |
| Weston Porter | Head of Sales | B2B sales strategy, distribution partnerships, HubSpot and the ARK dashboard |  | weston@leilo.com |
| Zak Burke | Sales | B2B sales, Southeast territory | Weston Porter | zak@leilo.com |
| James Boyce | Sales | B2B sales, California territory | Weston Porter | james@leilo.com |
| Ivee Dela Pena | Sales support | Outbound calls and account follow-up | Weston Porter | ivee@leilo.com |
| Joseph Marciano | Account Management Rep, B2B & Operations | B2B account management and operations support | Weston Porter and Brian Hanshaw | joseph@leilo.com |
| Brenden Silverman | Head of Digital & Direct-to-Consumer Sales | Ecommerce and DTC sales; digital marketing |  | brenden@leilo.com |
| Thea Catarata | Digital Design & Marketing | Design and digital marketing | Brenden Silverman | thea@leilo.com |
| Brian Hanshaw | Head of Operations | Operations, fulfillment and inventory |  | brian@leilo.com |
| Afthab Numan | Operations | Operations support | Brian Hanshaw | afthab@leilo.com |

## **Sales territories**

* Zak Burke: Southeast (FL, GA, SC, NC, MS, TN, AL)  
* James Boyce: California  
* Weston Porter: all other states/responsible for all BTB sales

## **Dashboard users**

Weston, Zak, James, Ivee and other team members. Permissions will be decided later.

## **External partners**

| Partner | Role | Status |
| ----- | ----- | ----- |
| Jade Street Consulting (JSC) | Broker | Leilo's broker through December 2026 |
| Greenspoon Sales | Broker | Becomes Leilo's broker starting December 2026 |
| Vdriven, LLC | Retail sales / brand management broker | Broker from June 2024 to November 25, 2026 |
| ARK Solutions (Michael “Mikey” Alfieri) | Developer of the ARK dashboard | Builds the ARK application and integrations |
| Greenberg Traurig (Justin Prochnow) | Regulatory counsel | Author of the [kava legal opinion letter](https://drive.google.com/file/d/1hZjS7yhYwTMPLZ2DWpSxw3xvePfPyQFK/view) |

# **Sales Channels & Ordering Methods**

Every Leilo sale comes through one of four ordering methods. Every sales label on the dashboard starts with its ordering method (for example "Direct Total Revenue"). HubSpot company property: **Ordering Method**.

| Ordering method | What it is | Where sales data comes from |
| ----- | ----- | ----- |
| Direct | Retailers buy straight from Leilo (wholesale site, Airgoods, Rep Rally, invoices) | Shopify orders, synced to HubSpot Orders. DSD, KEHE and UNFI orders are filtered out. |
| KEHE | National natural/specialty distributor; retailers order from KEHE | KEHE Connect BI reports (sales and stock status); EDI planned |
| UNFI | National natural distributor; same model as KEHE | Not yet activated |
| DSD | Direct Store Delivery: regional distributors, brokers and individuals who buy from Leilo and deliver to retailers | Each DSD partner's own reports (email, Encompass portal or manual request). See Distributors. |

## **Sales to vs. sales through a distributor**

* **Sales to** a distributor: Leilo's sales to KEHE, UNFI or a DSD partner (Shopify). Used on the Sales Overview.  
* **Sales through** a distributor: that distributor's sales to retailers (distributor reports). Used on the KEHE, UNFI and DSD tabs.  
* The two are always kept separate. In HubSpot, the DSD card holds a DSD partner's purchases from Leilo (sales to), and the DSD to Retailer card holds a retailer's purchases from a DSD partner (sales through).

## **Regions**

* **Nationwide**: all states.  
* **California**.  
* **Southeast**: FL, GA, SC, NC, MS, TN, AL.  
* Region is always based on the retailer location's address.

## **Key retail accounts**

Retailers with 30+ locations (store count in parentheses), from the JSC October 2026 tracker.

| Retailer | Distributor / DC | Retailer | Distributor / DC |
| ----- | ----- | ----- | ----- |
| Whole Foods (500) | UNFI | Wegmans (109) | UNFI York |
| Associated Food Stores (411) | KEHE DC 12 | Cub (105) | UNFI Prescott (Twin Cities) |
| HEB (330) | KEHE DC 19 (Dallas) | Niemann's (100) | UNFI Champaign or Greenwood |
| Harris Teeter (259) | Direct / UNFI Richburg | Market Basket (95) | UNFI Dayville |
| Meijer (254) | KEHE DC 18 | United Supermarkets (94) | KEHE DC 19 |
| HyVee (225) | Lomar | Piggly Wiggly Midwest (92) | UNFI Joliet |
| Northwest Grocers (221) | UNFI | Lowes Foods (80) | KEHE DC 01 |
| Jewel (Albertsons) (188) | KEHE DC 18 | Fresh Thyme Market (70) | UNFI 18 |
| The Fresh Market (170) | UNFI Richburg / CHEX | Foodtown (67) | KEHE DC 27 |
| Natural Grocers (166) | UNFI (MV, Gilroy, Stockton, Rocklin, Ridgefield) | Rouse's (65) | KEHE DC 19 |
| Giant Foods (165) | UNFI CHE | AJ's / Bashas' (55) | UNFI MV |
| Fareway (140) | UNFI IOW | Redners (44) | UNFI Howell |
| Brookshire Brothers (132) | KEHE DC 19 | Food Bazaar (40) | UNFI HVA |
| Winn Dixie (130) | UNFI Sarasota | Coborn's (39) | KEHE DC 18 |
| Raley's (118) | UNFI Rocklin | Foodland (31) | UNFI MV |
| Brookshire Grocery (109) | KEHE DC 19 / UNFI Lancaster | D'Agostino's / Gristedes (31) | KEHE DC 27 |

Also key: Sprouts, Albertsons, Target, Total Wine. Hawaii focus accounts include Down to Earth, Mana Foods and Tamura's.

# **Distributors**

Every distributor Leilo sells through. **Price / can** is what each distributor pays Leilo per 12 oz can on Shopify (sales to the distributor). DSD prices vary by distributor. Contract status and terms for every DSD partner (channels, termination fee, KEHE/UNFI carve-out, promo split, sampling, sign-on date, payment terms) are in the [Distributor/DSD summary](https://docs.google.com/spreadsheets/d/1vrNYuOLVu6pjyX0YWzEolzDTnLJUZa7pjxfGkTThJSU/edit).

## **National distributors**

| Distributor | Ordering method | Price / can to distributor | Distributor price to retailer | Status / notes |
| ----- | ----- | ----- | ----- | ----- |
| KEHE Distributors | KEHE | \$2.61 per can; Kava powders \$1.30 per stick | \$2.99 per can | Active. Sales and stock status from KEHE Connect. |
| UNFI | UNFI | TBD | TBD | Not yet activated |

## **DSD partners**

| DSD partner | Market / Territory | Price / can | Terms | How we receive sales data |
| ----- | ----- | ----- | ----- | ----- |
| Alabev | AL: State of Alabama, all counties. Industry Type: exclusive for all retail types; non-exclusive for Health, Wellness, and Fitness; excludes Sprouts and accounts ordering Direct | \$2.20 | Net 30 | Weekly email from htilashalski@alabev.com (forwarded), subject "AlaBev Weekly Sales" |
| Botanical Channel | NY: Long Island (Nassau and Suffolk Counties) | \$2.20 | Net 30 | Requested manually; sent by travisdoupe@gmail.com |
| Briggs Distributing | MT counties: Yellowstone, Carbon, Big Horn, Wheatland, Stillwater, Golden Valley, Musselshell, Sweet Grass, Park, Gallatin, Madison | \$2.09 | Net 30 | Monthly email from jmauser@briggsdistributing.com |
| Cali Sober Distribution | LA: Greater New Orleans area (no contract) | \$2.20 | Net 30 | Requested manually; sent from monica@calisoberdistribution.com |
| Craft Collective Homegrown (CCHG) | MA and RI: all counties, cities and towns (alcohol- and hemp-licensed retailers). Industry Type: Liquor Store and any account with an alcohol or hemp beverage license; excludes unlicensed accounts (e.g., Kava Bars, Smoke/Head Shop, Cafe/Coffee Shop) | \$2.09 | Net 30 | Encompass portal (prior 90 days report) |
| Longstraw LLC / Bellwether | NV (counties to confirm; no signed agreement found) | \$2.09 | Net 30 | Requested manually; sent from dave@bellwethernv.com |
| Elite Brands | CO: statewide, retailers with a CO liquor license (rural areas may not be serviced). Industry Type: Liquor Store and any account with a CO liquor license; excludes unlicensed accounts (e.g., Kava Bars, Smoke/Head Shop, Cafe/Coffee Shop) | \$2.09 | Net 30 | Encompass portal (YTD Sales Comparison and L90 reports) |
| Empire Beverage (Empire Distributors) | GA: statewide, all counties (per August 2026 draft agreement). Industry Type: excludes Smoke/Head Shop, C-Stores, Kava Bars and On-Premise. Includes Independent Grocery, Conventional Grocery, Supermarket and Liquor Store | \$2.09 | Net 30 | Automated emails (sender to confirm) |
| Gold Coast Distribution | NY: Manhattan, Brooklyn, and Queens, New York | \$2.20 | To confirm | Monthly email from mishka@goldcoastbklyn.com, subject "Leilo \- MONTH YEAR \- Gold Coast Sales Report" |
| Gusto Distributing | MT counties: Glacier, Toole, Liberty, Hill, Blaine, Phillips, Valley, Daniels, Sheridan, Roosevelt, Richland, McCone, Dawson, Wibaux, Prairie, Garfield, Petroleum, Fergus, Judith Basin, Chouteau, Pondera, Teton, Cascade, Lewis and Clark, Meagher, Broadwater, Rosebud, Treasure, Custer, Fallon, Carter, Powder River | \$2.20 | Net 30 | Account export / VIP report (cadence to confirm) |
| INFD (formerly SMNR) | CO Front Range, non-exclusive (Fort Collins to Castle Rock): southern Larimer, Boulder, Broomfield, western Adams, Denver, Jefferson, Arapahoe, northern Douglas, Gilpin and eastern Clear Creek Counties | \$2.09 | Net 90 | Weekly email from quickbooks@notification.intuit.com, subject "Financial reports for SMNR Sales LLC." |
| Mission Sales | MN (counties to confirm; no signed agreement found) | \$2.20 | Net 30 | Requested manually; sent from jm.edgeenterprises@gmail.com |
| John Lenore (JLC) | CA: San Diego County. Industry Type: exclusive for all retail types except Natural Chain Grocery accounts that require a national distributor (e.g., Sprouts, Whole Foods) and any account JLC cannot service | \$2.09 | Net 30 | Monthly automated report from Robin.s@johnlenore.com, forwarded by James |
| LAD (Los Angeles Distributing) | CA counties: Los Angeles, Orange, Riverside, San Bernardino, San Diego, Santa Barbara, Ventura (per LAD agreement v6). Industry Type: exclusive for all retail types; carve-out (only if the account will not take LAD delivery) for Drug Store/Pharmacy and mass/club chains with 500+ US stores, and Natural Chain Grocery (e.g., Whole Foods) | \$2.09 | Net 30 | Weekly Monday email from noreply@encompass8.com (Leilo Depletion MoM Report); Encompass portal |
| Mexcor | FL (counties to confirm; no signed agreement found) | \$2.09 | Net 30 | Encompass portal |
| My Beverage Company | FL: statewide (per April 2025 agreement). Industry Type: exclusive master distributor for smoke shop distributors and cash-and-carry wholesalers (Smoke Shop Cash and Carry/Distributor); other channels non-exclusive | \$2.20 | Net 45 | To confirm |
| Premier Island Brokerage (PIB) | HI: all Hawaiian Islands (semi-exclusive) | \$2.45 | Net 30 / 45 | Requested manually from maileen@premierislandbrokerage.com |
| Romano Beverage | IL: statewide, all counties. Industry Type: all Industry Types; primary focus is alcohol-licensed accounts (Liquor Store, On-Premise, Hospitality, licensed grocery and C-Stores) | \$2.06 | Net 60 | New partner (first PO Nov 2026); Encompass login pending |
| Sixth City Distribution | OH (agreement’s county/zip schedule is blank; counties to confirm). Industry Type: all Industry Types (agreement allows “all channels”) | \$2.09 | Net 30 | Requested manually; sent by alison.meredith@sixthcitydist.com |
| KMT Distribution | MI (Greater Detroit) | \$2.20; sticks \$1.25 | Prepay | To confirm |
| VR Distributors | NV (Greater Las Vegas) | \$2.20 | To confirm | To confirm |

Market / Territory rule: be as specific as the agreement allows (counties or cities, not just the state). When an agreement includes or excludes specific channels, the HubSpot Distributor Territory property quotes the agreement’s exact language, then adds the ARK Industry Type equivalent after the source note. Example (Empire): “...(per August 2026 draft agreement); Industry Type: excludes Smoke/Head Shop, C-Stores, Kava Bars and On-Premise. Includes Independent Grocery, Conventional Grocery, Supermarket and Liquor Store.” This table shows the territory and the Industry Type equivalent; the exact agreement language lives on each distributor’s HubSpot record. Distributor card revenue is sales to the distributor (Leilo’s Shopify orders from that distributor).

## **Other wholesale buyers at distributor pricing**

These accounts bought from Leilo on Shopify at distributor-level prices since March 2026 but are not on the DSD partner list. Confirm whether each should be added as a DSD partner, treated as a reseller, or left as a Direct account.

| Account | Price / can |
| ----- | ----- |
| BPS Distributors Ltd. (Cayman Islands) | \$2.15 |
| Paola Branda | \$2.15 |
| Sunset Wholesale West | \$2.20 |
| EastSide | \$2.20 |
| The Zero Proof Holdings | \$2.20 |
| Island Kava | \$2.30 |
| SD Suppliers / RA Shop / Speedy Distribution 2 | \$2.50 |
| Thrive Market | \$2.70 |
| Mary Jane’s House of Glass (smoke shop chain, 14 locations) | \$2.20 |

# **Pricing Assumptions**

Use these prices when a data source reports units or cases instead of dollars, and as the expected price when checking orders. **Leilo price** is what Leilo charges the buyer (sales to). **Wholesale price** is what the distributor typically charges the retailer (sales through).

## **Per-can assumptions by ordering method**

| Ordering method | Leilo price (sales to) | Wholesale price to retailer (sales through) | Notes |
| ----- | ----- | ----- | ----- |
| DSD | \$2.09 per can (typical). **DSD prices may vary by distributor.** | \$2.99 per can | Use each partner's actual price from the Distributors section when known. Most pay \$2.09; Romano pays \$2.06; Alabev, Botanical Channel, Cali Sober, Gold Coast Distribution, Gusto, Mission Sales and My Beverage Co pay \$2.20; Premier Island pays \$2.45. Kava powders: \$1.25 per stick to distributors; \$1.50 per stick through distributors. |
| KEHE | \$2.61 per can (Leilo to KEHE) | \$2.99 per can (KEHE to retailer) | Matches Shopify invoices to KeHE Distributors. Kava powders to KEHE: \$1.30 per stick. |
| Direct | \$2.99 per can, plus shipping | n/a (Leilo sells to the retailer) | \$107.64 per 36-pack \= \$2.99 per can. Kava powders \$1.50 per stick, or \$90 per 60-pack. Airgoods orders come through at \$2.84 per can; Rep Rally at \$3.15 per can. |
| UNFI | TBD | TBD | Not yet activated |

## **Shipping on Direct orders**

* About half of Direct orders since late October 2026 carried a shipping charge.  
* When charged, shipping averaged about \$20 per order; the most common charges were \$20, \$14 and \$23.  
* Shipping is not product revenue. Keep it out of revenue-per-can calculations.

## **Conversion rules**

* Distributor reports that show units or cases (sales through, including KEHE): multiply by the **wholesale price, \$2.99 per can**.  
* Leilo's sales to a distributor: use the actual Shopify invoice amount. If only units are known, use that distributor's price per can (DSD prices may vary), or \$2.61 for KEHE.  
* Case packs: a 4-pack case is 24 cans (six 4-packs); a single-can case is 12 cans; a 36-pack mastercase is 36 cans. "cs" means cases.  
* Kava powders: \$1.25 per stick to distributors (sales to); \$1.50 per stick through distributors (sales through).

# **Competitors**

Competitor brands from the ARK \- Leilo System document. The SPINS comparison list and the store locator scrape list are kept separate; a brand can be on both.

| Competitor | SPINS comparison | Store locator scrape |
| ----- | ----- | ----- |
| Hiyo | Yes |  |
| Recess | Yes | Yes |
| Kin Euphorics | Yes |  |
| Ghia | Yes |  |
| De Soi | Yes |  |
| Kava Haven | Yes | Yes |
| Melo | Yes | Yes |
| Kaviva | Yes | Yes |
| Brez | Yes |  |
| Little Saints | Yes |  |
| The NA Bev Co | Yes |  |
| Parch | Yes |  |
| Free AF | Yes |  |
| Aplos | Yes |  |
| Three Spirit | Yes |  |
| Edna's | Yes |  |
| Naked Life | Yes |  |
| Mingle | Yes |  |
| Trip | Yes |  |
| Moment | Yes |  |
| Mocktail Club | Yes |  |
| Luna Bay | Yes |  |

Weston can add new competitors to the store locator scrape list at any time so their store locators (and sales) can be pulled later.

# **Core Definitions**

## **Data and time**

* **Selected period / All Time:** Every metric can be pulled for a selected period or for all time.  
* **Lifetime:** The entire history of the sales data provided (same as All Time).  
* **Date filter options:** MTD, YTD, YTD vs. prior YTD, custom date range, All Time.  
* **YTD vs. prior YTD:** The same date range in each year, e.g. Jan 1 to Nov 16 vs. Jan 1 to Nov 16 of the prior year.  
* **Sales date:** Sales are assigned to a period by ship date.

## **Revenue**

* **Revenue:** Top-line revenue, typically the number shown in whatever sales source is provided. KEHE sales use shipped revenue.  
* **Sales to vs. through a distributor:** See Sales Channels & Ordering Methods. Kept separate for KEHE, UNFI and DSD.  
* **Converting units to revenue:** See Pricing Assumptions.

## **Orders**

* **Order:** Direct and DSD: each dated order counts as one order. KEHE weekly data: each week with an order counts as one order. KEHE daily data: each day with an order counts as one order.  
* **New account:** An account's first order ever, across any ordering method.  
* **In transit:** An order stays on the Sample / Order Tracking tab until 21 days after delivery.

## **Products**

* **SKU and product type:** Defined in the Master Price/SKU List 2026 B2B.  
* **Product types:** RTDs/Cans, Kava Powders, Kava Extract, Kava Flakes.  
* **SKUs Carried:** The SKUs an account ordered during the selected period.  
* **POD (point of distribution):** Each account × SKU sold during the selected period counts as one POD.  
* **"All of our SKUs" (upsell):** All flavors of cans and drink mixes. Kava flakes and kava extract are excluded from upsell lists unless explicitly stated .

## **Accounts**

* **Account:** A retailer company record in HubSpot. How multi-location retailers and chains are counted is still open (see Open Items).  
* **Door / Location:** One brick-and-mortar location with an address that carries our product.  
* **Industry Type:** The type of retailer (also called retailer type). Always the custom HubSpot property "Industry Type" (industry\_type), never the standard "Industry" field.  
* **Channel:** A type of retailer. "Sales in the independent grocery channel" means filter by Industry Type.  
* **Ordering Method:** How an account orders: DSD, Direct, UNFI or KEHE.  
* **DSD:** Every partner on the DSD distribution partner list.  
* **Region:** Based on the retailer location's address.  
* **Anchor Account:** A retailer large enough to activate distribution in a territory; it forces the distributor's hand to carry our product.  
* **High-volume account:** An account in the top 30% of its Industry Type, or in the top 15% of all Active customers, by total revenue for the selected period. Used for display shipper opportunities.  
* **Tier accounts:** Accounts grouped by share of revenue within a selected segment into bands: top 0-5%, 5-10%, 10-25% and 25-50%. 

## **Customer Type**

Customer Type is the HubSpot company property **Type** (internal name: type). It is the account's ordering / active-customer status. Every definition below is a draft and is highlighted for Weston to review.

### **Mature Customer**

An established account that has ordered more than once and has ordered within the last 150 days.

### **New Customer**

An account whose first paid order was within the last 90 days and that has not yet reordered. Moves to Mature Customer after its second order.

### **Distributor Customer**

A distributor that buys from Leilo to resell to retailers: KEHE, UNFI or a DSD partner (see Distributors).

### **Past Customer**

An account that has ordered before but has not ordered in more than 150 days.

### **Prospect**

An account that has never placed a paid order. It may have been contacted or sent samples.

### **Vendor**

A company that supplies goods or services to Leilo (for example manufacturing, packaging, freight or software). Not a customer.

### **Partner**

A non-customer business relationship such as a broker, co-marketing or co-brand partner, or affiliate.

### **Reseller**

A company that buys Leilo to resell but is not a DSD partner or national distributor, such as a wholesaler, cash-and-carry or online marketplace (for example Thrive Market or Rep Rally).

### **Other**

Anything that does not fit the types above. Records set to Other should be reviewed and reclassified.

### **Recency rules from the ARK spec**

The ARK spec measures account status from today, at the account level, using the most recent order from any ordering method (an account active through KEHE but past in Direct counts as active): Active \= ordered within 90 days; At Risk \= last order 90 to 150 days ago; Past Customer \= no order in more than 150 days; Prospect \= sampled but never ordered. There is no At Risk value in Type today; HubSpot Lead Status (120 / 180 Days No Reorder) covers part of this.

## **Industry Type**

Industry Type is the HubSpot company property **Industry Type** (internal name: industry\_type): the kind of retailer or business. It is the "channel" filter on the dashboard. 

| Industry Type | Definition |
| ----- | ----- |
| Kava Bars | Bars and lounges whose main offering is kava served on site. |
| Smoke/Head Shop | Shops selling tobacco, vape, glass and smoking accessories, often with hemp/CBD. |
| C-Stores | Convenience stores and gas stations. |
| Non-Alcoholic Bottle Shop | Retail shops specializing in non-alcoholic beer, wine, spirits and functional drinks. |
| Cafe/Coffee Shop | Coffee shops, tea bars and cafes. |
| Health, Wellness, and Fitness | Gyms, yoga studios, spas and wellness centers. |
| Hospitality | Hotels, resorts and event venues. |
| Mainline Distributor | Large national distributors such as KEHE and UNFI. |
| Regional Distributor | Distributors that cover a state or multi-state region (most DSD partners). Example Romano Beverage and Briggs Distributing |
| Independent Distributor | Small independent distributors, brokers or individual route operators.Example Longstraw LLC and Mission Sales |
| Smoke Shop Cash and Carry/Distributor | Wholesalers that supply smoke shops and c-stores. |
| Sub-Distributor | A distributor that orders from a DSD or distribution account instead of directly from Leilo. If a distributor shows up on a DSD distributor’s sales reporting, it is a sub-distributor. Its purchases go in its DSD to Retailer card. Example: San Diego Cash N Carry (buys from John Lenore). |
| Independent Grocery | Independently owned grocery stores or small local groups. |
| Conventional Grocery | Mainstream grocery chains. |
| Natural Chain Grocery | Natural and organic grocery chains (for example Sprouts, Fresh Thyme). |
| Supermarket | Large-format supermarkets. Overlaps with Conventional Grocery; decide whether to keep both. Example Walmart |
| Alternative Health | Any customer that carries kratom. Confirm whether this wins over other types (for example a health shop that also carries kratom). |
| On-Premise | Bars, restaurants and venues that sell drinks for consumption on site. |
| Manufacturer | Companies that make products (co-packers, other brands). |
| Universities/Colleges | Campus stores, markets and dining. |
| Liquor Store | Retailers whose main business is beer, wine and spirits. |
| Supplement | Vitamin and supplement retailers. |
| Drug Store/Pharmacy | Pharmacies and drug store chains. |
| Specialty Retail | Gift shops, boutiques, specialty food stores and other non-grocery retail. |
| Partner | Non-retail partner companies (brokers, affiliates). |
| Misc | Anything that does not fit; review and reclassify. |

## **Retention metrics**

* Total accounts ordered (selected period).  
* One- or two-time buyers: accounts that ordered 1 or 2 times and have gone more than 90 days without reordering (count and % over the past year).  
* Repeat accounts: % of accounts over the past year that ordered 3 or more times.  
* Of accounts that ordered in the past year, % that ordered in the past 90 days.  
* Of all accounts that ordered in the past 2 years, % that ordered in the past 90 days (Active).

## **KEHE**

* **Fill rate:** KEHE's definition: cases shipped ÷ cases ordered.  
* **KEHE DC:** A KEHE distribution center. Stock status shows inventory for each SKU in each DC.  
* **Stock status thresholds / problem DCs and SKUs:** Defined in the KEHE stock status prompt (see Key Links).  
* **INFRA:** Independent Natural Food Retailers Association, a buying group of independent natural retailers.  
* **NCG:** National Co+op Grocers, a co-op grocery buying group.

## **KEHE and UNFI DC codes**

**KEHE** numbers its distribution centers. Reports and the Stock Status Report refer to them as "DC 18", "KEHE-18" and so on. Source: [kehe.com/locations](https://www.kehe.com/locations/).

| KEHE DC | Location | Serves |
| :---: | :---: | :---: |
| DC 01 | Elkton, FL | E-commerce, grocery, natural |
| DC 12 | Aurora, CO | E-commerce, grocery, natural |
| DC 14 | Phoenix (Goodyear, AZ) | Grocery, natural |
| DC 15 | Lehigh Valley (Breinigsville, PA) | Grocery, natural |
| DC 16 | Ellettsville, IN | E-commerce, grocery, natural |
| DC 18 | Romeoville, IL | E-commerce, grocery |
| DC 19 | Dallas, TX | E-commerce, grocery, natural |
| DC 25 | Portland, OR | Grocery, natural |
| DC 27 | North East, MD | Grocery, natural |
| DC 31 | Miami (Hialeah, FL) | Grocery |
| DC 33 | Stockton, CA | Grocery, natural |
| DC 41 | Chino, CA | E-commerce, grocery, natural |
| DC 45 | Ontario, CA | Fresh |
| DC 46 | Tualatin, OR | Fresh |
| DC 55 | Douglasville, GA | Grocery, natural |

KEHE also has Canadian DCs (Calgary, Mississauga, Surrey and Woodbridge, ON) with no published DC numbers.

**UNFI** names its distribution centers by location; its site publishes no numeric codes. Reports refer to a DC by name or by a short abbreviation (for example "UNFI-CHE" or "UNFI MV"). The UNFI Dallas DC is in Lancaster, TX, which is why reports say "UNFI Lancaster". Source: [unfi.com/locations](https://www.unfi.com/locations.html).

| UNFI DC | Location | UNFI DC | Location |
| :---: | :---: | :---: | :---: |
| Allentown | Schnecksville, PA | MRDC GMHBC | Oglesby, IL |
| Anniston | Anniston, AL | Manchester | Manchester, PA |
| Atlanta (ATL) | Atlanta, GA | Mechanicsville | Mechanicsville, VA |
| Carlisle | Carlisle, PA | Moreno Valley (MV) | Moreno Valley, CA |
| Centralia | Centralia, WA | Newell | Newell, IL |
| Champaign | Urbana, IL | NorCal Produce | West Sacramento, CA |
| Chesterfield (CHE) | Chesterfield, NH | Pittsburgh | New Stanton, PA |
| Commerce | Commerce, CA | Pompano Beach | Pompano Beach, FL |
| Concord | Concord, ON | Prescott | Prescott, WI |
| Dallas | Lancaster, TX | Quincy | Quincy, FL |
| Dayville (DAY) | Dayville, CT | Richburg | Richburg, SC |
| Denver | Aurora, CO | Richmond | Richmond, BC |
| Fargo | Fargo, ND | Ridgefield | Ridgefield, WA |
| Gilroy | Gilroy, CA | Riverside | Riverside, CA |
| Green Bay | Green Bay, WI | Rocklin | Rocklin, CA |
| Greenwood | Greenwood, IN | SERF GMHC | Anniston, AL |
| Harrisburg | Harrisburg, PA | Saint-Laurent | Saint-Laurent, QC |
| Hopkins | Hopkins, MN | Santa Fe Springs | Santa Fe Springs, CA |
| Howell | Howell, NJ | Sarasota | Sarasota, FL |
| Hudson Valley (HV / HVA) | Montgomery, NY | Stevens Point | Stevens Point, WI |
| Indianola | Indianola, MS | Stockton Freezer-Deli | Stockton, CA |
| Iowa City (IOW) | Iowa City, IA | Stockton BWS | Stockton, CA |
| Joliet | Joliet, IL | Woodstock Farms | Edison, NJ |
| Londonderry | Londonderry, NH | York | York, PA |

Abbreviations in parentheses in the UNFI table are the short codes seen in Leilo's reports (JSC tracker, HubSpot) and are not published by UNFI. Confirm them, and confirm what "RD" and "CHEX" refer to.

## **Lead generation**

* **Lookalike retailer:** A retailer with a similar Industry Type, in the same region, that carries a competitor's product.  
* **Competitor lists:** See Competitors.

## **SPINS, promotions, tracking and store locator**

* **SPINS:** Syndicated retail data for the natural channel (incl. Sprouts). Displayed at SKU or brand level. Standard filters: drop Leilo 4-packs and any SKU under \$2,000 total dollars.  
* **SPINS periods:** 4, 12, 24 and 52 weeks.  
* **Promotion:** Includes KEHE national deals, MCBs (manufacturer chargebacks) and retailer-specific promotions.  
* **MCB:** Manufacturer chargeback: a promotion discount the distributor bills back to Leilo.  
* **Store locator:** Includes stores that have ordered in the last 180 days.  
* **POS:** Point-of-sale materials (displays, shelf talkers, merch).  
* **LTL:** Less-than-truckload freight shipments. These are pallet accounts/Distributor accounts. 

# **HubSpot Company Properties**

Definitions for every field on the left-hand side of a HubSpot company record, in the order they appear. Obvious contact fields (phone, street address, city, state, postal code) are listed without a definition. HubSpot is where the team acts on dashboard insights, so these fields also enrich the ARK dashboard (for example, filtering by Industry Type).

Account names and data routing rule: when a KEHE, UNFI or DSD/distributor report shows an account under a different company name but at the same address as an existing HubSpot company, keep the HubSpot company name, load the data onto that existing record (do not create a new company), and store the report’s name in that channel’s internal name property: KEHE Internal Company Name (kehe\_internal\_company\_name, bottom of the KEHE Sales card), UNFI Internal Company Name (unfi\_internal\_company\_name, bottom of the UNFI card) and DSD to Retailer Internal Company Name (dsd\_internal\_company\_name, bottom of the DSD to Retailer card). Format for DSD: “Partner: name as reported”, with multiple partners or names separated by semicolons (e.g., “LAD: Hi Ho Market”). Only fill these when the reported name differs from the HubSpot name; spelling or punctuation differences don’t count. A same name at a different address is not covered by this rule: flag it for review. Use the internal name when matching future reports, so the same account always routes to the same HubSpot record. The card for distributors themselves is titled “Distributor/DSD” (Distributor Total Revenue, SKUs Carried, First Order Date, Territory, Most Recent Order Date, Most Recent Order Revenue).

REVISIT \- DSD sales reporting rules (added Nov 22, 2026): (1) Closed accounts: when a DSD partner’s report marks an account closed (e.g., SMNR/INFD “DEAD”, “INACTIVE”, “CLOSED” or “CANCELLED”), still create or update the HubSpot company with its revenue and account information, and set Lead Status to “Closed Lost \- Business Closed”. If the same store is still buying through another distributor, add the sales but don’t mark it closed (e.g., Mile High Wine Cellars: inactive with SMNR, active with Elite). (2) Same name, different address: when a distributor’s account name matches a HubSpot company but the address differs, update the HubSpot company to the distributor’s address and load the data onto that record.

## **About this company**

| Field (label) | Internal name | Type / options | Definition |
| ----- | ----- | ----- | ----- |
| Account Notes | account\_notes | Text | Free-form running notes about the account: buyer preferences, ordering quirks, history and anything a rep should know before calling. Not for activity logs (use HubSpot notes for those). |
| Type | type | Dropdown: New Customer, Mature Customer, Distributor Customer, Past Customer, Prospect, Vendor, Partner, Reseller, Other | Customer Type: the account's ordering / active-customer status. Draft definitions for each value are in Core Definitions \> Customer Type. • **New Customer**: placed its first order recently and has not yet reordered. • **Mature Customer**: established account with repeat orders. • **Distributor Customer**: a distributor (KEHE, UNFI or DSD partner) that buys from Leilo. • **Past Customer**: ordered before but no longer active. • **Prospect**: not yet a customer. • **Vendor**: supplies goods or services to Leilo. • **Partner / Reseller / Other**: non-retail relationships.  |
| Lead Status | hs\_lead\_status | Dropdown | Where the account stands in sales outreach or reorder health. • **New**: new record, not yet worked. • **Prospect \- In Progress / Not Yet Open / Kava Hesitancy / Not Interested**: prospect outreach stages and reasons. • **Active**: currently ordering. • **120 Days No Reorder / 180 Days No Reorder**: existing customer that has gone 120 or 180 days without reordering. • **Closed Lost \- \[reason\]**: lost account, with the reason (Business Closed, Slow Sell-Through, Unqualified, Carrying Competitor, New Ownership / Business Change, Unsatisfied With Service, Kava Hesitancy, Not Interested, Unsure, Generic). • **N/A**: not applicable (e.g. vendors). |
| Industry Type | industry\_type | Dropdown | The type of retailer or business (retailer type / channel). The property used for every channel filter on the dashboard; never use the standard Industry field. Options: Kava Bars; Smoke/Head Shop; C-Stores; Non-Alcoholic Bottle Shop; Cafe/Coffee Shop; Health, Wellness, and Fitness; Hospitality; Mainline Distributor; Regional Distributor; Independent Distributor; Smoke Shop Cash and Carry/Distributor; Independent Grocery; Conventional Grocery; Natural Chain Grocery; Supermarket; Alternative Health; On-Premise; Manufacturer; Universities/Colleges; Liquor Store; Supplement; Drug Store/Pharmacy; Specialty Retail; Partner; Misc; Sub-Distributor. If blank, the dashboard should suggest the most likely type or flag it for manual update. |
| Street Address, City, State/Region, Postal Code, Phone Number | address, city, state, zip, phone | Text | Location and main phone of the retail location. |
| Company owner | hubspot\_owner\_id | HubSpot user | The Leilo team member responsible for the account (normally assigned by territory). |
| Ordering Method | ordering\_method | Multi-select: DSD, Direct, UNFI, KEHE (legacy: Wholesale Site, Faire, Distributor, Affiliate) | How the account buys Leilo. An account can have more than one (e.g. KEHE;DSD). The legacy options should be migrated: Wholesale Site and Faire → Direct; Distributor → DSD, KEHE or UNFI. |

## **KEHE Sales**

Retailer purchases through KEHE (sales through KEHE).

| Field (label) | Internal name | Type / options | Definition |
| ----- | ----- | ----- | ----- |
| INFRA? | infra | Yes / No | Whether the account is a member of INFRA (Independent Natural Food Retailers Association), which unlocks INFRA promotions through KEHE. |
| Store Size | store\_size | Text | Only Relevant to INFRA retailers. Small, Medium, Large and LF.  |
| KEHE First Order | kehe\_first\_order | Date | Date of the account's first order through KEHE. |
| KEHE Recent Order Date | kehe\_recent\_order\_date | Date | Date of the account's most recent order through KEHE. |
| KEHE SKUs (All Time) | kehe\_skus | Text list | Every Leilo SKU the account has ever ordered through KEHE. |
| KEHE Prior 3 Months Fill Rate | prior\_3\_months\_fill\_rate | Percent | KEHE fill rate (cases shipped ÷ cases ordered) on this account's orders over the prior 3 months. |
| KEHE SKUs (3 Months) | kehe\_skus\_3\_months | Text list | SKUs ordered through KEHE in the last 3 months. Compare with All Time to spot dropped SKUs. |
| KEHE Prior 90 Days Revenue | kehe\_prior\_90\_days\_revenue | Currency | Revenue through KEHE over the prior 90 days. |
| KEHE Total Revenue | kehe\_total\_revenue | Currency | Lifetime revenue for the account through KEHE. |
| KEHE Internal Company Name | kehe\_internal\_company\_name | Text | The name KEHE uses for this account (e.g., the KEHE store name) when it differs from the HubSpot name at the same address. See the account names and data routing rule. |

## **KEHE Info**

How KEHE classifies the account.

| Field (label) | Internal name | Type / options | Definition |
| ----- | ----- | ----- | ----- |
| KeHE DC | kehe\_dc | Text | The KEHE distribution center that serves the account. |
| Retailer Name | retailer\_name | Text | KEHE's parent retailer name, e.g. ACI (Albertsons Companies Inc). |
| Retailer Area | retailer\_area | Text | KEHE's retailer area / division, e.g. ACI Nor Cal. |
| Main Store | main\_store | Text | KEHE's main store or banner, e.g. Andronico's. |
| Sub Store | sub\_store | Text | KEHE's specific store location, e.g. SAFEWAY NOR CAL \#173 \- MONTEREY, CA. |

## **UNFI**

Retailer purchases through UNFI (sales through UNFI). UNFI is not yet activated.

| Field (label) | Internal name | Type / options | Definition |
| ----- | ----- | ----- | ----- |
| NCG? | ncg | True / False | Whether the account is a National Co+op Grocers (NCG) member. |
| UNFI First Order | unfi\_first\_order | Date | Date of the account's first UNFI order. |
| UNFI Recent Order Date | unfi\_recent\_order\_date | Date | Date of the account's most recent UNFI order. |
| UNFI Total Revenue | unfi\_total\_revenue | Currency | Lifetime revenue for the account through UNFI. |
| UNFI SKUs (All Time) | unfi\_skus\_all\_time | Text list | All SKUs the account has ordered through UNFI. |
| UNFI Prior 3 Months Fill Rate | unfi\_prior\_3\_months\_fill\_rate | Percent | UNFI fill rate (cases shipped ÷ cases ordered) over the prior 3 months. |
| UNFI Prior 90 Days Revenue | unfi\_prior\_90\_days\_revenue | Currency | Revenue through UNFI over the prior 90 days. |
| UNFI DC | unfi\_dc | Dropdown: MV, RD | UNFI distribution center code(s) serving the account (full DC names to confirm). |
| UNFI Internal Company Name | unfi\_internal\_company\_name | Text | The name UNFI uses for this account in its reports when it differs from the HubSpot name at the same address. See the account names and data routing rule. |

## **Direct**

Calculated automatically from HubSpot Orders (synced from Shopify). Today these fields count all non-zero HubSpot orders for the company.

| Field (label) | Internal name | Type / options | Definition |
| ----- | ----- | ----- | ----- |
| Avg Days To Reorder | avg\_days\_to\_reorder | Number (days) | Average number of days between the account's orders. |
| Most Recent Order Date (Processed) | most\_recent\_order\_date\_\_processed\_ | Date | Date of the account's latest processed order. |
| Average Order Value | average\_order\_value | Currency | Average dollar value per order (total net sales ÷ number of orders). |
| First Order Date (Processed) | first\_order\_date\_\_processed\_ | Date | Date of the account's first processed order. |
| Days Since Last Order (Num) | days\_since\_last\_order\_\_num\_ | Number | Days between today and the most recent order (numeric, for sorting and workflows). |
| Days Since Last Order Date | days\_since\_last\_order\_date | Text / duration | Same as above, displayed as a readable duration (e.g. 5.8 months). |
| Order History \- Flavors | order\_history\_\_\_flavors | Text | Flavors the account has ordered over time. |
| All Products Ordered | all\_products\_ordered | Text list | Every SKU code the account has ordered, including merch. |
| Avg Days to Re-Order \- Days Since Last Order | avg\_days\_to\_re\_order\_\_\_days\_since\_last\_order | Number | Avg Days To Reorder minus Days Since Last Order. Positive \= days left before a reorder is normally due; negative \= overdue by that many days. Used to prioritize reorder calls. |
| Customer Since (Days Since First Order) | customer\_since\_\_days\_since\_first\_order\_ | Duration | How long the account has been a customer, measured from its first order. |
| Number of Orders (Last 180 Days) | number\_of\_orders\_\_last\_180\_days\_ | Number | Orders placed in the most recent 180 days. |
| Number of Associated Non-Zero Orders | number\_of\_associated\_orders | Number | Total lifetime orders with a dollar value above \$0 (excludes free samples). |
| Number of Orders (Previous 180 Days) | number\_of\_orders\_\_previous\_180\_days\_ | Number | Orders placed in the 180 days before the last 180 (days 181-360). |
| Net Sales (Last 180 Days) | net\_sales\_\_last\_180\_days\_ | Currency | Net sales over the most recent 180 days. |
| Net Sales (Previous 180 Days) | net\_sales\_\_previous\_180\_days\_ | Currency | Net sales over days 181-360. Compare with the last 180 days to see growth or decline. |
| Total Net Sales | total\_net\_sales | Currency | Lifetime net sales from the Orders object. |
| Direct Source | direct\_source | Multi-select: Rep Rally, Airgoods, Wholesale Site | Which direct ordering platform(s) the account uses. |
| Direct Total Revenue | direct\_total\_revenue | Currency | Lifetime revenue for the account through Direct only (excludes DSD, KEHE and UNFI orders that also pass through Shopify). |

## **DSD to Retailer**

A retailer's purchases from a DSD partner (sales through DSD). Filled from DSD partners' sales reports.

| Field (label) | Internal name | Type / options | Definition |
| ----- | ----- | ----- | ----- |
| DSD Partner | dsd\_distributor | Multi-select: PIB, Elite, Alabev, Romano, Empire, LAD, Mexcor, CCHG, Briggs, 6th City, John Lenore, SMNR, Gold Coast, Botanical Channel, Bellweather, James Mullen, Cali Sober, Gusto | The DSD distributor(s) that deliver Leilo to this account. |
| DSD to Retailer First Order | dsd\_first\_order | Date | Date of the account's first order through a DSD partner. |
| DSD to Retailer Recent Order Date | dsd\_recent\_order\_date | Date | Date of the account's most recent order through a DSD partner. |
| DSD to Retailer Revenue | dsd\_revenue | Currency | Revenue through DSD partners for the current reporting period. Units are converted at \$2.99 per can / \$1.50 per stick when no dollars are reported. |
| DSD to Retailer SKUs (All Time) | dsd\_skus\_purchased | Text list | Every SKU the account has bought through DSD partners. |
| DSD to Retailer Prior 3 Months Fill Rate | dsd\_prior\_3\_months\_fill\_rate | Percent | Share of cases ordered that the DSD partner delivered over the prior 3 months (only where the partner reports it). |
| DSD to Retailer SKUs (3 Months) | dsd\_skus\_3\_months | Text list | SKUs ordered through DSD partners in the last 3 months. |
| DSD to Retailer Prior 90 Days Revenue | dsd\_prior\_90\_day\_revenue | Currency | Revenue through DSD partners over the prior 90 days. |
| DSD to Retailer Total Revenue | dsd\_total\_revenue | Currency | Lifetime revenue for the account through DSD partners. |
| DSD to Retailer Internal Company Name | dsd\_internal\_company\_name | Text | The name(s) the DSD partner uses for this account in its sales report when it differs from the HubSpot name at the same address. Format “Partner: name as reported”; separate multiple with semicolons. See the account names and data routing rule. |

## **Account Details**

| Field (label) | Internal name | Type / options | Definition |
| ----- | ----- | ----- | ----- |
| Description | description | Text | Short description of the business (what they sell, size, vibe). |
| Total Locations | total\_locations | Number | Number of store locations the company operates. |
| Parent Company | hs\_parent\_company\_id | Company association | The parent or chain record this location rolls up to. |
| Target Account | hs\_is\_target\_account | Yes / No | Whether the company is a priority target in the account-based sales strategy. |
| Outbound Focus | outbound\_focus | Yes / No | Whether the account is on the current outbound calling focus list. |
| Follow Up | follow\_up | Date | Date the next follow-up with the account is due. |
| Distributor / Buying from | distributor\_\_buying\_from | Text | Free-text note of which distributor or source the account buys Leilo (or similar products) from. Being replaced by Ordering Method \+ DSD Partner for structured reporting. |

## **DSD**

A DSD partner's own purchases from Leilo (sales to DSD). Filled from Leilo's orders to that partner.

| Field (label) | Internal name | Type / options | Definition |
| ----- | ----- | ----- | ----- |
| DSD First Order | dsd\_direct\_first\_order | Date | Date of this DSD partner's first order from Leilo. |
| DSD Recent Order Date | dsd\_direct\_recent\_order\_date | Date | Date of this DSD partner's most recent order from Leilo. |
| DSD Revenue | dsd\_direct\_revenue | Currency | Revenue from this DSD partner's orders with Leilo for the current reporting period. |
| DSD SKUs (All Time) | dsd\_direct\_skus\_all\_time | Text list | Every SKU this DSD partner has ordered from Leilo. |
| DSD Prior 3 Months Fill Rate | dsd\_direct\_prior\_3\_months\_fill\_rate | Percent | Share of the partner's ordered cases that Leilo shipped over the prior 3 months. |
| DSD SKUs (3 Months) | dsd\_direct\_skus\_3\_months | Text list | SKUs this DSD partner ordered from Leilo in the last 3 months. |
| DSD Prior 90 Days Revenue | dsd\_direct\_prior\_90\_days\_revenue | Currency | Revenue from this DSD partner's orders over the prior 90 days. |
| DSD Total Revenue | dsd\_direct\_total\_revenue | Currency | Lifetime revenue from this DSD partner's orders with Leilo. |

# **Dashboard Tabs & Metrics**

## **Dashboard-wide rules**

* Region filter: Nationwide, California, Southeast (FL, GA, SC, NC, MS, TN, AL).  
* Date filter: MTD, YTD, YTD vs. prior YTD, custom range, All Time.  
* Every sales label starts with its ordering method, e.g. "Direct Total Revenue".  
* Standard sales data points for Direct, DSD, KEHE and UNFI: \[Ordering Method\] Total Revenue, SKUs Carried, Total PODs, Revenue by Product Type, Revenue by SKU, Revenue by Industry Type.

## **Dashboard tabs**

| \# | Tab | Purpose | Key metrics / contents |
| ----- | ----- | ----- | ----- |
| 1 | Sales Overview | Quick read on business health: where revenue comes from, how much, and who generates it. Combines all four ordering methods; KEHE, UNFI and DSD show Leilo's sales to them. | Total revenue by ordering method, SKU and product type; account retention metrics; Active / At Risk / Past / Prospect counts; tier accounts; accounts and revenue by Industry Type |
| 2 | KEHE | Stay current on KEHE: fill rates, new accounts, account health, upsell opportunities and DC stock status. Shows KEHE's sales to retailers. | KEHE Total Locations, Total Revenue (shipped), SKUs Carried, Total PODs, PODs by SKU, Revenue by Product Type / SKU / Industry Type; fill rate for any date range; color-coded DC stock status chart |
| 3 | Direct | Direct retailer sales from HubSpot Orders, with DSD, KEHE and UNFI orders filtered out. | Direct standard data points plus number of accounts ordering over 30-, 60- and 90-day periods |
| 4 | DSD | Sales through DSD partners, at all-DSD level or per partner. Data also pushed back into HubSpot (retailer, address, Industry Type, order data). | DSD standard data points plus DSD Revenue by Distributor |
| 5 | Lead Generation | Growth opportunities, split into KEHE, Direct and DSD leads. | At Risk and Past Customers (sorted by revenue); existing-customer upsell (missing SKUs, display shipper candidates); new leads from competitor store locators and lookalike retailers |
| 6 | SPINS Data | Natural-channel (incl. Sprouts) performance vs. competitors; arguments for retailers. | Brand Rank, Item Rank and Sprouts Item Matrix for 4/12/24/52 weeks; competitor comparisons |
| 7 | Brand Kit / Marketing Materials | One place for digital assets and POS designs. | POS materials, with inventory tracked in Shopify (folders in Key Links) |
| 8 | SKU Data / Information | SKU details and master price list. | Linked SKU sheet; supplement facts panels to be added |
| 9 | Promotion Calendar | All KEHE, UNFI and DSD promotions and discounts across the year (DSD promotions are housed in the same promotion calendar). | Calendar or chart view of the promo calendar sheet |
| 10 | UNFI | Same as KEHE once UNFI is active. | UNFI standard data points, Total Locations, PODs by SKU |
| 11 | Sample / Order Tracking | Tracking for samples, POS and in-transit orders (via ShipStation). | Shopify orders tagged sample, POS or merch; B2B LTL orders (B- numbers); shown until 21 days after delivery |
| 12 | Auto-Updating Store Locator | Keep the public store locator current automatically, weekly. | Stores that ordered in the last 180 days, across all ordering methods |

## **SPINS competitor set**

Hiyo, Recess, Kin Euphorics, Ghia, De Soi, Kava Haven, Melo, Kaviva, Brez, Little Saints, The NA Bev Co, Parch, Free AF, Aplos, Three Spirit, Edna's, Naked Life, Mingle, Trip, Moment, Mocktail Club, Luna Bay.

# **Data Sources & Integrations**

What each system is used for. Credentials are intentionally not stored here.

| System | Used for | Connection status / method |
| ----- | ----- | ----- |
| Shopify | Entire B2B revenue at a high level, by account (Direct, plus DSD/KEHE/UNFI orders entered there). Tags drive sample, POS and merch tracking. | Live. Custom app with read\_orders (past 60 days; read\_all\_orders needed for full history). |
| HubSpot | Where the team acts on insights: company records, tasks, email campaigns. Properties like Industry Type enrich the dashboard. Orders object holds Direct sales. | Live. Private app token (companies read); more read scopes needed, write scopes when DSD data is pushed back. |
| KEHE Connect | KEHE sales to retailers, fill rates and DC stock status. | Manual report pulls today; best path for V1 is EDI via SPS Commerce, Leilo's EDI provider (no public API; no scraping without KEHE consent). |
| Encompass | DSD partners' sales portals (CCHG, Elite, LAD, Mexcor, Romano). | Logins per distributor; manual export or scheduled report emails. |
| Email (DSD reports) | DSD partner sales reports that arrive by email. | Planned: auto-forward report emails to one ARK backend inbox. |
| SPINS | Natural-channel sales and competitor comparison. | Manual pulls; API (Sales API GraphQL or MyExtracts) to be requested from SPINS. |
| UNFI | UNFI sales to retailers. | Not yet activated. |
| ZoomInfo | Contact information for leads. | Connected via API app (Leilo ARK system). |
| ShipStation | Order and sample tracking. | Integration planned. |
| Google Drive | File storage: sales reports, SPINS pulls (dated subfolders, e.g. 11-20-26), promo calendar, store locator, marketing materials. | Connected. |

All document, folder and portal links are collected in the **Key Links** tab.

## **ARK tech stack**

* Next.js 16, React 19, TypeScript, Tailwind CSS 4  
* Neon Postgres (orders, accounts, sync metadata)  
* Vercel (hosting), GitHub (source control)  
* Live integrations: Shopify, HubSpot

## **How the systems fit together**

* Shopify gives the high-level health of the business.  
* KEHE and DSD data give the health of the distributors and what reaches retailers.  
* HubSpot is where Weston directs the team to act on what the dashboard shows.

# **Open Items**

## **Definitions still to be decided**

* Customer Type and Retention metrics: review the highlighted draft definitions. (Industry Type definitions are confirmed.)  
* Account: how multi-location retailers and chains are counted.  
* Account health: definition and scoring.  
* "Good opportunity" criteria for background leads.  
* Prospect source: confirm Shopify "sample" tags import into HubSpot.  
* Data refresh cadence for each tab.  
* Which SPINS views are displayed on the dashboard.

## **Pricing and distributor checks**

* KEHE price confirmed: \$2.61 per can to KEHE; \$2.99 per can from KEHE to retailers.  
* Decide how to treat the other wholesale buyers at distributor pricing (Island Kava, VR Distributors, BPS Distributors, etc.). 

## **HubSpot clean-up**

* Type has no At Risk value; decide whether to add one or rely on Lead Status.  
* Direct card fields are calculated from all HubSpot orders, which include DSD, KEHE and UNFI orders entered in Shopify. Confirm whether they should be Direct-only.  
* DSD Partner option list uses older names for some partners (SMNR \= INFD, CCHG \= Craft Collective Homegrown, Bellwether \= Bellwether) and is missing My Beverage Company.  
* UNFI DC codes (MV, RD): confirm full DC names.

## **Weston to-dos carried over from the ARK spec**

* Add supplement facts panels to the SKU tab.  
* Identify HubSpot contact-page properties to add.  
* Upload existing DSD retailers into HubSpot with ordering method and order data.  
* Automate reporting of new accounts ordering within DSD areas.  
* Set Ordering Method to Direct for Shopify accounts and DSD for DSD retailers.  
* DSD contracts and territories: identify unclear territories; build a DSD terms sheet (payment terms, termination fee).  
* Fix the Mexcor Encompass password; get Romano login.  
* Email SPINS support about API access.  
* Send scheduled Claude prompts to Zak and James for them to plug in 

