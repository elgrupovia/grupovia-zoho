// app/api/zoho/fields/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getZohoAccessToken, zohoEventsModuleApiName } from "@/app/lib/zoho";

export async function GET() {
  try {
    const token = await getZohoAccessToken();
    const moduleApiName = zohoEventsModuleApiName();

    const base = process.env.ZOHO_API_BASE;
    if (!base) {
      return NextResponse.json(
        { error: "ZOHO_API_BASE not defined" },
        { status: 500 }
      );
    }

    const r = await fetch(
      `${base}/crm/v2/settings/fields?module=${moduleApiName}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json(
        { error: "Zoho error", detail: text },
        { status: r.status }
      );
    }

    const data = await r.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
