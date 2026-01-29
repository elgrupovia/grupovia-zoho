// app/api/zoho/record/route.ts
import { NextResponse } from "next/server";
import { zohoJson } from "@/app/lib/zoho";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const module = searchParams.get("module");
    const id = searchParams.get("id");

    if (!module || !id) {
      return NextResponse.json(
        { ok: false, error: "Use ?module=...&id=..." },
        { status: 400 }
      );
    }

    const path = `/crm/v2/${encodeURIComponent(module)}/${encodeURIComponent(id)}`;
    const { status, data } = await zohoJson(path);

    return NextResponse.json(
      { ok: status >= 200 && status < 300, status, data },
      { status }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
