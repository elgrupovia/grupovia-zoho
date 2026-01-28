type ZohoTokenResponse = {
  access_token: string;
  api_domain?: string;
  token_type?: string;
  expires_in?: number;
};

export async function getZohoAccessToken(): Promise<string> {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL;

  if (!clientId || !clientSecret || !refreshToken || !accountsUrl) {
    throw new Error("Faltan variables ZOHO_* en .env.local");
  }

  const url =
    `${accountsUrl}/oauth/v2/token` +
    `?refresh_token=${encodeURIComponent(refreshToken)}` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&client_secret=${encodeURIComponent(clientSecret)}` +
    `&grant_type=refresh_token`;

  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zoho token error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as ZohoTokenResponse;
  if (!data.access_token) {
    throw new Error(`Zoho token error: respuesta sin access_token`);
  }

  return data.access_token;
}
