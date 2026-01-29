// app/lib/zoho.ts
// Librería server-side para Zoho CRM (OAuth refresh token + helpers fetch)

type TokenCache = {
  accessToken: string;
  expiresAt: number; // epoch ms
};

let cache: TokenCache | null = null;
let refreshInFlight: Promise<string> | null = null;

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function apiBase() {
  // EU: https://www.zohoapis.eu
  // US: https://www.zohoapis.com
  // IN: https://www.zohoapis.in
  return mustEnv("ZOHO_API_BASE").replace(/\/+$/, "");
}

function accountsBase() {
  // EU: https://accounts.zoho.eu
  return mustEnv("ZOHO_ACCOUNTS_URL").replace(/\/+$/, "");
}

async function refreshAccessToken(): Promise<string> {
  const clientId = mustEnv("ZOHO_CLIENT_ID");
  const clientSecret = mustEnv("ZOHO_CLIENT_SECRET");
  const refreshToken = mustEnv("ZOHO_REFRESH_TOKEN");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const res = await fetch(`${accountsBase()}/oauth/v2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({} as any));

  if (!res.ok) {
    throw new Error(`Zoho token error ${res.status}: ${JSON.stringify(data)}`);
  }

  if (!data?.access_token) {
    throw new Error(`Zoho token response missing access_token: ${JSON.stringify(data)}`);
  }

  const expiresInSec = typeof data.expires_in === "number" ? data.expires_in : 3600;

  // Guardamos margen: expira 60s antes
  cache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Math.max(30, expiresInSec - 60) * 1000,
  };

  return cache.accessToken;
}

async function getAccessToken(): Promise<string> {
  if (cache && Date.now() < cache.expiresAt) return cache.accessToken;

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      return await refreshAccessToken();
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

// ✅ Esto es lo que tu endpoint /zoho/fields estaba importando
export async function getZohoAccessToken(): Promise<string> {
  return getAccessToken();
}

// Helpers base (por si tu app los usa)
export function zohoWebBase() {
  return process.env.ZOHO_CRM_WEB || "https://crm.zoho.eu";
}

export function zohoEventsModuleApiName() {
  return process.env.ZOHO_EVENTS_MODULE_API_NAME || "Eventos";
}

function buildUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase()}${p}`;
}

async function fetchZoho(
  path: string,
  init: RequestInit = {},
  retryOn401 = true
): Promise<Response> {
  const url = buildUrl(path);
  const token = await getAccessToken();

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Zoho-oauthtoken ${token}`,
      ...(init.headers && (init.headers as any)["content-type"]
        ? {}
        : {}),
    },
    cache: "no-store",
  });

  if (res.status !== 401 || !retryOn401) return res;

  // 401: token inválido -> fuerza refresh y reintenta 1 vez
  cache = null;
  const token2 = await getAccessToken();

  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Zoho-oauthtoken ${token2}`,
    },
    cache: "no-store",
  });
}

// ✅ Export que tus rutas importan
export async function zohoJson<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetchZoho(path, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Zoho API error (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as T;
}

// ✅ Export que tu ruta de imagen importa
export async function zohoRaw(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetchZoho(path, init);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Zoho RAW error (${res.status}): ${text || res.statusText}`);
  }

  return res;
}
