import { NextResponse } from "next/server";
import { zohoJson } from "@/app/lib/zoho";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const moduleApiName = process.env.ZOHO_EVENTS_MODULE_API_NAME || "Eventos";

    // OJO: usa la MISMA versión que tu listado (si tu listado usa v7, aquí también)
    const data = await zohoJson(`/crm/v7/${encodeURIComponent(moduleApiName)}/${encodeURIComponent(id)}`);

    const record = data?.data?.[0];
    if (!record) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const evento = {
      id: record.id,
      titulo: record?.Name ?? "Evento",
      fechaISO: record?.Date ?? "",
      ciudad: record?.City ?? null,
      lugar: record?.Location ?? null,
      categoria: record?.Category ?? null,
      imagenUrl: `/api/eventos/${encodeURIComponent(record.id)}/imagen`,
      descripcion: record?.Description ?? null,
      ctaTexto: record?.CTA_Texto ?? null,
      ctaUrl: record?.CTA_URL ?? null,
    };

    return NextResponse.json(evento);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Zoho error", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
