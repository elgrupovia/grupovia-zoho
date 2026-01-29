// app/lib/zoho.ts
/**
 * Helpers para hablar con Zoho CRM usando OAuth2 refresh token.
 *
 * - Usa refresh_token + client_id + client_secret para obtener access_token.
 * - Cachea el access_token en memoria (solo dura el proceso de Next dev).
 * - Si Zoho responde 401, refresca y reintenta 1 vez.
 *
 * Requiere en .env.local:
 *   ZOHO_CLIENT_ID=...
 *   ZOHO_CLIENT_SECRET=...
 *   ZOHO_REFRESH_TOKEN=...
 *   ZOHO_ACCOUNTS_URL=https://accounts.zoho.eu   (o .com/.in según tu región)
 *   ZOHO_API_BASE=https://www.zohoapis.eu       (o .com/.in según tu región)
 */

type ZohoTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  api_domain?: string;
  error?: string;
  error_description?: string;
};

const requiredEnv = [
  "ZOHO_CLIENT_ID",
  "ZOHO_CLIENT_SECRET",
  "ZOHO_REFRESH_TOKEN",
  "ZOHO_ACCOUNTS_URL",
  "ZOHO_API_BASE",
] as const;

function assertEnv() {
  const missing = requiredEnv.filter((k) => !process.env[k] || !String(process.env[k]).trim());
  if (missing.length) {
    throw new Error(`Faltan variables en .env.local: ${missing.join(", ")}`);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

let accessToken: string | null = null;
let accessTokenFetchedAt = 0;
// Zoho suele dar ~3600s. Guardamos un margen para refrescar antes.
let accessTokenTTLms = 50 * 60 * 1000; // 50 min

// ✅ NUEVO: evita tormenta de refresh cuando hay muchas requests a la vez
let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  assertEnv();

  const tokenUrl = `${process.env.ZOHO_ACCOUNTS_URL}/oauth/v2/token`;

  const body = new URLSearchParams({
    refresh_token: String(process.env.ZOHO_REFRESH_TOKEN),
    client_id: String(process.env.ZOHO_CLIENT_ID),
    client_secret: String(process.env.ZOHO_CLIENT_SECRET),
    grant_type: "refresh_token",
  });

  let json: ZohoTokenResponse | null = null;
  try {
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    });

    // Zoho normalmente devuelve JSON incluso en error.
    const text = await res.text();
    try {
      json = text ? (JSON.parse(text) as ZohoTokenResponse) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      const detail =
        json?.error_description ||
        json?.error ||
        text ||
        `HTTP ${res.status}`;
      throw new Error(`Zoho refresh token falló: ${detail}`);
    }

    if (!json?.access_token) {
      throw new Error(`Zoho refresh no devolvió access_token. Respuesta: ${text}`);
    }

    accessToken = json.access_token;
    accessTokenFetchedAt = Date.now();

    // Ajustamos TTL si viene expires_in
    if (typeof json.expires_in === "number" && json.expires_in > 0) {
      // -5 min de margen
      accessTokenTTLms = Math.max(5 * 60 * 1000, (json.expires_in - 300) * 1000);
    }

    return accessToken;
  } catch (err: any) {
    // Si el fetch falla (sin respuesta), suele ser DNS/proxy/firewall
    if (String(err?.message ?? "").includes("fetch failed")) {
      throw new Error(
        `fetch failed al pedir token a ${tokenUrl}. Revisa conexión/proxy/firewall y que ZOHO_ACCOUNTS_URL sea correcto.`
      );
    }
    throw err;
  }
}

async function getAccessToken(): Promise<string> {
  // Si existe y no está expirado, devolvemos
  if (accessToken && Date.now() - accessTokenFetchedAt < accessTokenTTLms) {
    return accessToken;
  }

  // ✅ NUEVO: si ya hay refresh corriendo, espera al mismo
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

function buildUrl(path: string) {
  assertEnv();
  const base = String(process.env.ZOHO_API_BASE).replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

// ✅ NUEVO: fetch con backoff simple para 429 (rate limit)
async function fetchWithBackoff(url: string, init: RequestInit, maxRetries = 3): Promise<Response> {
  let res = await fetch(url, init);

  if (res.status !== 429) return res;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const waitMs = Math.min(10_000, 400 * 2 ** attempt); // 800, 1600, 3200...
    await sleep(waitMs);
    res = await fetch(url, init);
    if (res.status !== 429) break;
  }

  return res;
}

/** Fetch JSON con reintento automático si token inválido (401). */
export async function zohoJson<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = buildUrl(path);

  // 1er intento
  const token1 = await getAccessToken();
  const res1 = await fetchWithBackoff(
    url,
    {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Zoho-oauthtoken ${token1}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
    3
  );

  // Si ok, devolvemos
  if (res1.ok) return (await res1.json()) as T;

  // Si 401 -> refrescamos y reintentamos 1 vez
  if (res1.status === 401) {
    // fuerza refresh (y evita carreras con refreshInFlight)
    accessToken = null;
    accessTokenFetchedAt = 0;

    await getAccessToken();
    const token2 = await getAccessToken();

    const res2 = await fetchWithBackoff(
      url,
      {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          Authorization: `Zoho-oauthtoken ${token2}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
      3
    );

    if (res2.ok) return (await res2.json()) as T;

    const text2 = await res2.text();
    throw new Error(
      `Zoho API error tras refresh (${res2.status}): ${text2 || res2.statusText}`
    );
  }

  const text1 = await res1.text();
  throw new Error(`Zoho API error (${res1.status}): ${text1 || res1.statusText}`);
}

/** Fetch binario (imagenes, downloads) con reintento 401. */
export async function zohoRaw(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = buildUrl(path);

  const token1 = await getAccessToken();
  const res1 = await fetchWithBackoff(
    url,
    {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Zoho-oauthtoken ${token1}`,
      },
      cache: "no-store",
    },
    3
  );

  if (res1.ok) return res1;

  if (res1.status === 401) {
    // fuerza refresh (y evita carreras con refreshInFlight)
    accessToken = null;
    accessTokenFetchedAt = 0;

    await getAccessToken();
    const token2 = await getAccessToken();

    const res2 = await fetchWithBackoff(
      url,
      {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          Authorization: `Zoho-oauthtoken ${token2}`,
        },
        cache: "no-store",
      },
      3
    );

    if (res2.ok) return res2;

    const text2 = await res2.text();
    throw new Error(
      `Zoho RAW error tras refresh (${res2.status}): ${text2 || res2.statusText}`
    );
  }

  const text1 = await res1.text();
  throw new Error(`Zoho RAW error (${res1.status}): ${text1 || res1.statusText}`);
}
