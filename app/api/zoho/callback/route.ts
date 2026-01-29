// app/lib/zoho.ts
type TokenCache = {
  accessToken: string;
  expiresAt: number; // epoch ms
};

let cache: TokenCache | null = null;

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function getZohoAccessToken(): Promise<string> {
  // cache 55 min (Zoho suele dar 3600s)
  if (cache && Date.now() < cache.expiresAt) return cache.accessToken;

  const accounts = mustEnv("ZOHO_ACCOUNTS_URL");
  const clientId = mustEnv("ZOHO_CLIENT_ID");
  const clientSecret = mustEnv("ZOHO_CLIENT_SECRET");
  const refreshToken = mustEnv("ZOHO_REFRESH_TOKEN");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken
  });

  const r = await fetch(`${accounts}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const raw = await r.text();
  if (!r.ok) {
    throw new Error(`Zoho token refresh failed (${r.status}): ${raw}`);
  }

  const data = JSON.parse(raw) as {
    access_token: string;
    expires_in: number;
  };

  cache = {
    accessToken: data.access_token,
    // un poco antes de que expire
    expiresAt: Date.now() + Math.max(30, data.expires_in - 60) * 1000
  };

  return cache.accessToken;
}

export function zohoApiBase() {
  return mustEnv("ZOHO_CRM_API_BASE");
}

export function zohoWebBase() {
  return process.env.ZOHO_CRM_WEB || "https://crm.zoho.eu";
}

export function zohoEventsModuleApiName() {
  // tu módulo REAL (CustomModule1) es "Eventos"
  return process.env.ZOHO_EVENTS_MODULE_API_NAME || "Eventos";
}
