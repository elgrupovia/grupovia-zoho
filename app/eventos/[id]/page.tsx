import Link from "next/link";
import { headers } from "next/headers";

type Evento = {
  id: string;
  titulo: string;
  fechaISO?: string | null;
  ciudad?: string | null;
  lugar?: string | null;
  categoria?: string | null;

  imagenUrl?: string | null;

  descripcion?: string | null;
  ctaTexto?: string | null;
  ctaUrl?: string | null;
};

function formatFecha(fechaISO?: string | null) {
  if (!fechaISO) return "";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(fechaISO));
  } catch {
    return String(fechaISO);
  }
}

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");

  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (envBase) return envBase.replace(/\/+$/, "");

  return `${proto}://${host}`;
}

async function fetchEvento(id: string): Promise<Evento | null> {
  const baseUrl = await getBaseUrl();
  const res = await fetch(
    new URL(`/api/eventos/${encodeURIComponent(id)}`, baseUrl),
    { cache: "no-store" }
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`No se pudo cargar el evento (${res.status})`);

  return (await res.json()) as Evento;
}

export default async function EventoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const evento = await fetchEvento(id);

  if (!evento) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Evento no encontrado</h1>
        <p className="mt-3 text-sm text-black/70">
          Puede que el evento ya no exista en Zoho o el enlace sea incorrecto.
        </p>
        <Link
          href="/eventos"
          className="mt-8 inline-flex rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold hover:bg-black/5"
        >
          Volver a eventos
        </Link>
      </main>
    );
  }

  const fecha = formatFecha(evento.fechaISO);
  const ctaTexto = evento.ctaTexto?.trim() || "Solicitar información";
  const ctaUrl = evento.ctaUrl?.trim() || "#contacto";

  const heroImg =
    evento.imagenUrl?.trim() ||
    `/api/eventos/${encodeURIComponent(evento.id)}/imagen`;

  const ubicacion = [
    (evento.lugar ?? "").trim(),
    (evento.ciudad ?? "").trim(),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="bg-white text-black">
      {/* HERO (estilo LineWay: título + card details en el propio hero) */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt={evento.titulo}
            className="h-[70vh] w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-20 text-white md:py-28">
          <div className="grid gap-10 md:grid-cols-2 md:items-end">
            {/* Left: title */}
            <div className="max-w-2xl">
              <div className="text-sm font-semibold tracking-[0.22em] text-white/80">
                {(evento.categoria ?? "").trim() ? evento.categoria : "EVENT"}
              </div>

              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
                {evento.titulo}
              </h1>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
                {fecha && (
                  <div className="flex items-center gap-2">
                    <span aria-hidden>🗓️</span>
                    <span className="capitalize">{fecha}</span>
                  </div>
                )}
                {ubicacion && (
                  <div className="flex items-center gap-2">
                    <span aria-hidden>📍</span>
                    <span>{ubicacion}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: details card */}
            <div className="rounded-2xl bg-black/55 p-6 backdrop-blur-md md:justify-self-end md:w-[440px]">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/60">DATE &amp; TIME</div>
                  <div className="mt-1 font-semibold capitalize">
                    {fecha || "Por definir"}
                  </div>
                </div>

                <div>
                  <div className="text-white/60">LOCATION</div>
                  <div className="mt-1 font-semibold">
                    {ubicacion || "Por definir"}
                  </div>
                </div>
              </div>

              <a
                href={ctaUrl}
                className="mt-5 block rounded-xl bg-[#c7a457] px-6 py-3 text-center text-sm font-semibold text-black hover:opacity-90"
              >
                {ctaTexto}
              </a>

              <Link
                href="/eventos"
                className="mt-3 block text-center text-sm font-semibold text-white/80 hover:underline"
              >
                Ver todos los eventos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Columna editorial */}
          <div className="md:col-span-2">
            <div className="text-sm font-semibold tracking-[0.2em] text-[#c7a457]">
              ABOUT THIS EVENT
            </div>

            <h2 className="mt-4 text-3xl font-semibold md:text-4xl">
              Una experiencia diseñada para conectar
            </h2>

            {/* ✅ Sin placeholder: si no hay descripción, no se muestra */}
            {(evento.descripcion ?? "").trim() && (
              <p className="mt-4 text-sm leading-7 text-black/70">
                {evento.descripcion}
              </p>
            )}

            {/* Secciones tipo landing (listas para conectar con campos Zoho reales) */}
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-white p-6">
                <h3 className="text-lg font-semibold">Qué obtendrás</h3>
                <p className="mt-2 text-sm leading-7 text-black/70">
                  Networking curado, conversaciones útiles y un formato premium con foco en valor real.
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-6">
                <h3 className="text-lg font-semibold">Para quién es</h3>
                <p className="mt-2 text-sm leading-7 text-black/70">
                  Profesionales del sector (ajustable según el tipo de evento).
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-6">
                <h3 className="text-lg font-semibold">Formato</h3>
                <p className="mt-2 text-sm leading-7 text-black/70">
                  Sesión + networking + experiencia. (Luego lo conectamos a Agenda/Programa si existe en Zoho.)
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-6">
                <h3 className="text-lg font-semibold">Ubicación</h3>
                <p className="mt-2 text-sm leading-7 text-black/70">
                  {ubicacion || "Por definir"}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar (en body) */}
          <aside className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold tracking-[0.2em] text-[#c7a457]">
              DETAILS
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-black/50">Fecha</dt>
                <dd className="font-semibold capitalize">{fecha || "Por definir"}</dd>
              </div>

              <div>
                <dt className="text-black/50">Ubicación</dt>
                <dd className="font-semibold">{ubicacion || "Por definir"}</dd>
              </div>
            </dl>

            <a
              href={ctaUrl}
              className="mt-7 block rounded-full bg-[#c7a457] px-6 py-3 text-center text-sm font-semibold text-black hover:opacity-90"
            >
              {ctaTexto}
            </a>

            <div className="mt-4 text-center">
              <Link
                href="/eventos"
                className="text-sm font-semibold text-black/70 hover:underline"
              >
                Volver al listado
              </Link>
            </div>
          </aside>
        </div>

        {/* Contacto / ancla */}
        <div
          id="contacto"
          className="mt-16 rounded-2xl border border-black/10 bg-neutral-100 p-8"
        >
          <div className="text-sm font-semibold tracking-[0.2em] text-[#c7a457]">
            GET IN TOUCH
          </div>
          <h3 className="mt-4 text-2xl font-semibold">
            ¿Quieres asistir o colaborar?
          </h3>
          <p className="mt-2 text-sm leading-7 text-black/70">
            Aquí conectamos CTA real: formulario, WhatsApp, email, Zoho Form… lo que tú decidas.
          </p>
        </div>
      </section>
    </main>
  );
}
