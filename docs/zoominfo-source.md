# ZoomInfo

ZoomInfo connects with OAuth2 client credentials from the ZoomInfo Developer Portal or GTM.ai API tab. Put the client ID and secret in `.env.local` only. Do not commit them.

```env
ZOOMINFO_CLIENT_ID=
ZOOMINFO_CLIENT_SECRET=
```

Optional:

- `ZOOMINFO_INDUSTRY_KEYWORDS` — comma-separated industry keyword searches (default: kava bar, natural foods store, health food retailer).
- `ZOOMINFO_COMPANY_NAMES` — comma-separated `companyName` searches (competitor brands or targets).
- `ZOOMINFO_STATE` — single U.S. state code to narrow every search.

On Sources, sync **ZoomInfo**. Each sync runs those searches, dedupes by ZoomInfo company id, and upserts `accounts` with `source = zoominfo` and `customer_type = Prospect`.

They appear on Lead Generation under **New leads** alongside HubSpot prospects. Enrich is not wired yet; search returns name, location, and website basics only.

The integration user chosen in the ZoomInfo app must have data API access. A 403 usually means missing scopes or a wrong integration user.