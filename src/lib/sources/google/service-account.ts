import { createSign } from "node:crypto";

export type ServiceAccount = { client_email: string; private_key: string };

export const GOOGLE_SCOPE = {
  sheets: "https://www.googleapis.com/auth/spreadsheets.readonly",
  drive: "https://www.googleapis.com/auth/drive.readonly",
} as const;

export function readServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ?? "";
  const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  try {
    const parsed = JSON.parse(json) as Partial<ServiceAccount>;
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error("missing fields");
    }
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
    };
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON could not be read. Paste the service account JSON or its base64 form.");
  }
}

export async function googleAccessToken(account: ServiceAccount, scopes: string[]) {
  const scope = [...new Set(scopes)].join(" ");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  let signature = "";
  try {
    const signer = createSign("RSA-SHA256");
    signer.update(`${header}.${claim}`);
    signature = signer.sign(account.private_key, "base64url");
  } catch {
    throw new Error("The service account private key could not be used.");
  }
  const assertion = `${header}.${claim}.${signature}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`Google refused the service account (${response.status}).`);
  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token) throw new Error("Google did not return an access token.");
  return body.access_token;
}

export function googleServiceAccountConfigured() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim());
}

function base64url(value: string) {
  return Buffer.from(value).toString("base64url");
}