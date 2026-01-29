// app/eventos/page.tsx
import Link from "next/link";
import { headers } from "next/headers";

type Evento = {
  id: string;
  titulo: string;
  ciudad?: string | null;
  categoria?: string | null;
  fechaISO?: string | null;
  lugar?: string | null;
  imagenUrl?: string | null;
};

function fechaCorta(fechaISO?: string | null) {
  if (!fechaISO) return "";
  const d = new Date(fechaISO);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

async function getBaseUrl() {
  const envBase =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (envBase) return envBase;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function normalizaEventos(payload: any): Evento[] {
  if (Array.isArray(payload)) return payload as Evento[];
  if (!payload) return [];
  if (Array.isArray(payload.eventos)) return payload.eventos as Evento[];
  if (Array.isArray(payload?.data)) return payload.data as Evento[];
  if (Array.isArray(payload?.data?.eventos)) return payload.data.eventos as Evento[];
  return [];
}

async function getEventos(): Promise<Evento[]> {
  const baseUrl = await getBaseUrl();
  const url = new URL("/api/eventos", baseUrl);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();

  const eventos = normalizaEventos(json);
  return [...eventos].sort((a, b) => {
    const da = a.fechaISO ? new Date(a.fechaISO).getTime() : Number.POSITIVE_INFINITY;
    const db = b.fechaISO ? new Date(b.fechaISO).getTime() : Number.POSITIVE_INFINITY;
    return da - db;
  });
}

function EventoCard({ e }: { e: Evento }) {
  const imgSrc = e.id ? `/api/eventos/${e.id}/imagen` : "";

  return (
    <article className="rounded-2xl bg-white shadow-sm border border-black/5 overflow-hidden">
      <div className="aspect-[16/9] bg-black/5">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={e.titulo}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold leading-snug">{e.titulo}</h3>

        <div className="mt-3 text-sm text-black/60 space-y-2">
          {e.fechaISO ? (
            <div className="flex items-center gap-2">
              <span aria-hidden>🗓️</span>
              <span>{fechaCorta(e.fechaISO)}</span>
            </div>
          ) : null}

          {e.ciudad ? (
            <div className="flex items-center gap-2">
              <span aria-hidden>📍</span>
              <span>{e.ciudad}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            href={`/eventos/${e.id}`}
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-[#C7A34B] text-black hover:opacity-90"
          >
            Ver ficha
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function EventosPage() {
  const eventos = await getEventos();

  return (
    <main className="min-h-screen bg-[#F7F4EF] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <div className="text-xs tracking-[0.3em] uppercase text-[#C7A34B]">Events</div>
          <h1 className="mt-4 text-6xl font-semibold">Todos los eventos</h1>
          <p className="mt-4 text-black/60">Listado completo desde Zoho CRM.</p>
        </div>

        <div className="mt-16">
          {eventos.length === 0 ? (
            <p className="text-center text-black/60">No hay eventos para mostrar.</p>
          ) : (
            <div className="grid gap-8 md:grid-cols-3">
              {eventos.map((e) => (
                <EventoCard key={e.id} e={e} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-16 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full px-8 py-3 font-semibold border border-black/10 bg-white hover:bg-black/5"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
