// app/api/zoho/ping/route.ts
import { NextResponse } from "next/server";
import { zohoJson } from "@/app/lib/zoho";

export async function GET() {
  try {
    const { status, data } = await zohoJson("/crm/v2/users?type=AllUsers");

    return NextResponse.json(
      { ok: status >= 200 && status < 300, status, data },
      { status: status }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
