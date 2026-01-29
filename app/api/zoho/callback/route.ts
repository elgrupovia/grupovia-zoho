export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ ok: false, error: "Missing ?code" }, { status: 400 });
  }

  const accountsUrl = mustEnv("ZOHO_ACCOUNTS_URL");        // https://accounts.zoho.eu
  const clientId = mustEnv("ZOHO_CLIENT_ID");
  const clientSecret = mustEnv("ZOHO_CLIENT_SECRET");

  // ⚠️ En Vercel esto debe ser tu URL pública, NO localhost
  const redirectUri = mustEnv("ZOHO_REDIRECT_URI");        // https://tu-app.vercel.app/api/zoho/callback

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(`${accountsUrl}/oauth/v2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, status: res.status, zoho: data },
      { status: 500 }
    );
  }

  // ✅ Aquí Zoho suele devolver access_token y (a veces) refresh_token.
  // IMPORTANTÍSIMO: no devuelvas tokens tal cual en producción.
  // Para debug puntual puedes devolverlos *redactados*:
  const safe = {
    ok: true,
    received: {
      access_token: data?.access_token ? "[REDACTED]" : null,
      refresh_token: data?.refresh_token ? "[REDACTED]" : null,
      api_domain: data?.api_domain ?? null,
      expires_in: data?.expires_in ?? null,
      token_type: data?.token_type ?? null,
    },
    // Si necesitas capturar refresh_token para guardarlo en Vercel manualmente,
    // míralo en logs del servidor (console.log) de forma temporal y luego elimínalo.
  };

  return NextResponse.json(safe);
}
