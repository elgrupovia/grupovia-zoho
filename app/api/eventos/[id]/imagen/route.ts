import { NextResponse } from "next/server";
import { zohoRaw } from "@/app/lib/zoho";

// 1x1 PNG transparente para cuando NO hay imagen (evita "imagen rota")
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6X9f9cAAAAASUVORK5CYII=",
  "base64"
);

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  if (!id) {
    // devolvemos un PNG vacío para que el <img> no se rompa
    return new NextResponse(TRANSPARENT_PNG, {
      status: 200,
      headers: {
        "content-type": "image/png",
        "cache-control": "no-store",
      },
    });
  }

  try {
    // Foto del registro (Zoho CRM): /crm/v2/{module_api_name}/{record_id}/photo
    const moduleApiName = process.env.ZOHO_EVENTS_MODULE_API_NAME || "Eventos";
    const path = `/crm/v2/${moduleApiName}/${id}/photo`;

    const res = await zohoRaw(path);

    // Zoho suele devolver 204 (sin contenido) o 404 si no hay foto.
    if (res.status === 204 || res.status === 404) {
      return new NextResponse(TRANSPARENT_PNG, {
        status: 200,
        headers: {
          "content-type": "image/png",
          "cache-control": "no-store",
        },
      });
    }

    if (!res.ok) {
      // cualquier otro error -> también devolvemos placeholder para no romper la UI
      return new NextResponse(TRANSPARENT_PNG, {
        status: 200,
        headers: {
          "content-type": "image/png",
          "cache-control": "no-store",
        },
      });
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
      },
    });
  } catch {
    // si algo explota, seguimos devolviendo placeholder
    return new NextResponse(TRANSPARENT_PNG, {
      status: 200,
      headers: {
        "content-type": "image/png",
        "cache-control": "no-store",
      },
    });
  }
}
