import { NextResponse } from "next/server";
import { getZohoAccessToken } from "@/app/lib/zoho";

type Evento = {
  id: string;
  titulo: string;
  ciudad: string;
  categoria: string;
  fechaISO: string;
  lugar: string;
  imagen: string;
};

function pick(obj: any, keys: string[]) {
  for (const k of keys) {
    if (obj?.[k]) return obj[k];
  }
  return "";
}

function toEvento(record: any): Evento {
  // ⚠️ Ajustaremos estos campos a tu módulo real.
  // Estos "pick" intentan encontrar valores comunes sin romper.
  const titulo = pick(record, ["Title", "Subject", "Name", "Evento", "Nombre"]);
  const ciudad = pick(record, ["City", "Ciudad"]);
  const categoria = pick(record, ["Category", "Categoria", "Categoría"]);
  const fechaISO = pick(record, ["Start_DateTime", "Start_Date", "Fecha", "FechaISO"]);
  const lugar = pick(record, ["Venue", "Lugar", "Location", "Ubicacion", "Ubicación"]);
  const imagen = pick(record, ["Image_URL", "Imagen", "Image", "Cover", "Portada"]);

  return {
    id: String(record?.id ?? ""),
    titulo: titulo || "(Sin título)",
    ciudad: ciudad || "",
    categoria: categoria || "",
    fechaISO: fechaISO || "2026-01-01T09:00:00",
    lugar: lugar || "",
    imagen: imagen || "https://picsum.photos/seed/grupovia-fallback/900/600",
  };
}

export async function GET() {
  try {
    const token = await getZohoAccessToken();
    const base = process.env.ZOHO_CRM_API_BASE;

    if (!base) {
      throw new Error("Falta ZOHO_CRM_API_BASE en .env.local");
    }

    // ✅ Aquí debes poner el nombre REAL del módulo en Zoho CRM.
    // Ejemplos típicos: "Events", "Activities", "Deals", o un módulo personalizado.
    const MODULE_API_NAME = "Events";

    const url = `${base}/crm/v2/${MODULE_API_NAME}?per_page=50&sort_order=desc`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { error: `Zoho CRM error ${res.status}`, details: text },
        { status: 500 }
      );
    }

    const json = JSON.parse(text);
    const data = Array.isArray(json?.data) ? json.data : [];
    const eventos: Evento[] = data.map(toEvento).filter((e) => e.id);

    return NextResponse.json({ eventos });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
