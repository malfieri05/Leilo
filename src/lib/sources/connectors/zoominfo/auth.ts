const TOKEN_URL = "https://api.zoominfo.com/gtm/oauth/v1/token";
const USER_AGENT = "leilo-ark/1.0";

let cache: { token: string; expiresAt: number } | null = null;

export async function zoomInfoAccessToken(): Promise<string> {
  const clientId = process.env.ZOOMINFO_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.ZOOMINFO_CLIENT_SECRET?.trim() ?? "";
  if (!clientId || !clientSecret) {
    throw new Error("Set ZOOMINFO_CLIENT_ID and ZOOMINFO_CLIENT_SECRET.");
  }

  const now = Date.now();
  if (cache && cache.expiresAt > now + 30_000) return cache.token;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error(`ZoomInfo refused the client credentials (${response.status}). Check the Developer Portal app.`);
  }
  if (!response.ok) {
    throw new Error(`ZoomInfo token request failed (${response.status}).`);
  }

  const body = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw new Error("ZoomInfo did not return an access token.");

  const ttl = typeof body.expires_in === "number" ? body.expires_in : 900;
  cache = { token: body.access_token, expiresAt: now + ttl * 1000 };
  return body.access_token;
}