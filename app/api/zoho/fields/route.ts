import { NextResponse } from "next/server";
import { getZohoAccessToken } from "../../../lib/zoho";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const moduleApiName = searchParams.get("module");

  if (!moduleApiName) {
    return NextResponse.json(
      { ok: false, error: "Use ?module=<api_name>" },
      { status: 400 }
    );
  }

  const token = await getZohoAccessToken();
  const base = process.env.ZOHO_CRM_API_BASE || "https://www.zohoapis.eu";

  const r = await fetch(`${base}/crm/v2/settings/fields?module=${moduleApiName}`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
 acknowledge: false,
    cache: "no-store",
  });

  const raw = await r.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch {}

  return NextResponse.json(
    { ok: r.ok, status: r.status, data },
    { status: r.ok ? 200 : 400 }
  );
}
