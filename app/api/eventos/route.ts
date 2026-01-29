// app/api/eventos/route.ts
import { NextResponse } from "next/server";
import { zohoJson } from "@/app/lib/zoho";

/**
 * Lista eventos desde Zoho CRM (módulo: "Eventos").
 *
 * Importante:
 * - Este endpoint NUNCA debería tumbar la UI. Si Zoho falla, devolvemos ok:false + data:[] en 200.
 *   Así, la web sigue renderizando (y tú ves el error en consola).
 *
 * GET /api/eventos
 */
export async function GET() {
  try {
    // Ajusta los campos si tu módulo cambia
    const params = new URLSearchParams({
      fields: "Name,City,Date,Record_Image",
      sort_by: "id",
      sort_order: "desc",
      page: "1",
      per_page: "200",
    });

    // Zoho CRM v7: /crm/v7/<ModuleAPIName>
    const raw = await zohoJson<any>(`/crm/v7/Eventos?${params.toString()}`);

    const list = Array.isArray(raw?.data) ? raw.data : [];

    const data = list.map((row: any) => {
      const id = String(row?.id ?? "");
      const recordImage = row?.Record_Image;

      // Nota: en tu Zoho, Record_Image suele venir como array u objeto.
      // La imagen real la servimos con /api/eventos/:id/imagen
      return {
        id,
        titulo: row?.Name ?? "",
        fechaISO: row?.Date ?? null,
        ciudad: row?.City ?? "",
        categoria: row?.Category ?? "",
        lugar: row?.Location ?? "",
        imagen: recordImage ?? null,
        imagenUrl: id ? `/api/eventos/${id}/imagen` : "",
      };
    });

    return NextResponse.json(
      { ok: true, status: 200, data, zoho: raw?.info ?? null },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌  /api/eventos error:", err);

    // devolvemos 200 con ok:false para no romper render
    return NextResponse.json(
      {
        ok: false,
        status: 200,
        error: String(err?.message ?? err ?? "Error desconocido"),
        data: [],
      },
      { status: 200 }
    );
  }
}
