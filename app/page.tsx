// app/page.tsx
import { headers } from "next/headers";

type Evento = {
  id: string;
  titulo: string;
  ciudad?: string | null;
  categoria?: string | null;
  fechaISO: string;
  lugar?: string | null;
  // Estos campos pueden venir vacíos; la imagen real la servimos desde /api/eventos/:id/imagen
  imagen?: string | null;
  imagenUrl?: string | null;
};

function fechaCorta(fechaISO: string) {
  const d = new Date(fechaISO);
  return d
    .toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
    .replace(".", "");
}

async function getBaseUrl() {
  // En Next 16+ headers() es async
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");

  // Si defines NEXT_PUBLIC_BASE_URL (ej: https://tudominio.com) lo usará
  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (envBase) return envBase.replace(/\/+$/, "");

  return `${proto}://${host}`;
}

async function getEventos(): Promise<Evento[]> {
  const baseUrl = await getBaseUrl();
  const res = await fetch(new URL("/api/eventos", baseUrl), { cache: "no-store" });

  if (!res.ok) return [];

  const json = await res.json();

  // Tu /api/eventos devuelve: { ok:true, status:200, data:[...] }
  // Pero dejamos fallback por si cambia.
  const eventos = (json?.data ?? json?.eventos ?? json?.data?.eventos ?? []) as Evento[];

  return Array.isArray(eventos) ? eventos : [];
}

export default async function Home() {
  const eventos = await getEventos();
  const upcoming = eventos.slice(0, 3);

  return (
    <main className="bg-white text-black">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/60" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2400&q=60)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-white md:py-28">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold tracking-[0.2em] text-white/80">
              ELEVATE YOUR NETWORK
            </div>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
              Eventos que conectan personas, marcas e ideas
            </h1>
            <p className="mt-5 text-base text-white/80">
              Misma estética tipo LineWay. Datos vivos desde Zoho CRM para próximos eventos,
              ubicaciones, fechas e imágenes.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#upcoming"
                className="rounded-full bg-[#c7a457] px-6 py-3 text-sm font-semibold text-black hover:opacity-90"
              >
                Upcoming Events
              </a>
              <a
                href="#contact"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold hover:bg-white/10"
              >
                Get in touch
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-sm font-semibold tracking-[0.2em] text-[#c7a457]">ABOUT US</div>
          <h2 className="mt-4 text-3xl font-semibold md:text-4xl">Diseño premium, datos reales</h2>
          <p className="mt-4 text-sm leading-7 text-black/70">
            With over 25 years of experience organizing high-level professional events across Spain and Portugal, we have mastered the art of creating meaningful connections, inspiring conversations, and memorable experiences.

We specialize in networking & corporate events for the sectors of architecture, interior design, hospitality, and real estate development, bringing together top industry leaders in exclusive, high-value environments.

Now, we bring this deep-rooted expertise to Dubai — a city where innovation meets ambition.
Our events in Dubai are not just gatherings; they are carefully curated experiences that blend international vision with local excellence. From exclusive forums and networking encounters to immersive formats tailored to each industry, every detail is designed to spark value and lasting impact.

We create inspiring spaces where top professionals connect, ideas grow, and collaborations begin.

Welcome to a new way of connecting
          </p>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section id="upcoming" className="bg-neutral-100">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <div className="text-sm font-semibold tracking-[0.2em] text-[#c7a457]">
              UPCOMING EVENTS
            </div>
            <h2 className="mt-4 text-3xl font-semibold md:text-4xl">Próximos eventos</h2>
          </div>

          {upcoming.length === 0 ? (
            <p className="mt-8 text-center text-sm text-black/60">No hay eventos para mostrar.</p>
          ) : (
            <div className="mt-10 grid gap-10 md:grid-cols-3">
              {upcoming.map((e) => (
                <article key={e.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  <div className="aspect-[16/10] w-full bg-black/5">
                    {/* La imagen SIEMPRE se sirve desde el endpoint interno */}
                    <img
                      src={`/api/eventos/${encodeURIComponent(e.id)}/imagen`}
                      alt={e.titulo}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="p-6">
                    <h3 className="text-base font-semibold leading-snug">{e.titulo}</h3>

                    <div className="mt-4 space-y-2 text-sm text-black/70">
                      <div className="flex gap-2">
                        <span aria-hidden>🗓️</span>
                        <span>{fechaCorta(e.fechaISO)}</span>
                      </div>
                      {(e.lugar ?? "").trim() !== "" && (
                        <div className="flex gap-2">
                          <span aria-hidden>📍</span>
                          <span>{e.lugar}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-sm font-semibold text-black/70">{e.ciudad ?? ""}</span>
                      <a
                        href={`/eventos/${encodeURIComponent(e.id)}`}
                        className="rounded-full bg-[#c7a457] px-4 py-2 text-xs font-semibold text-black hover:opacity-90"
                      >
                        Ver ficha
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <a
              href="/eventos"
              className="inline-flex rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold hover:bg-black/5"
            >
              Ver todos los eventos
            </a>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <div className="text-sm font-semibold tracking-[0.2em] text-[#c7a457]">SERVICES</div>
          <h2 className="mt-4 text-3xl font-semibold md:text-4xl">Qué hacemos</h2>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {[
            {
              title: "Conference Sessions",
              text: "Programas y ponencias con enfoque profesional y producción cuidada.",
            },
            { title: "Architect Connect", text: "Networking sectorial con agenda y matching." },
            { title: "Exclusive Dining", text: "Cenas y experiencias premium para comunidad." },
            { title: "Private Events", text: "Eventos corporativos y privados llave en mano." },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl border border-black/10 bg-white p-6">
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-7 text-black/70">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="bg-neutral-100">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="text-center">
            <div className="text-sm font-semibold tracking-[0.2em] text-[#c7a457]">GET IN TOUCH</div>
            <h2 className="mt-4 text-3xl font-semibold md:text-4xl">Contacto</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-black/70">
              Este formulario luego lo conectamos a Zoho CRM (Leads/Contacts) para que entre directo
              al pipeline.
            </p>
          </div>

          <form className="mx-auto mt-10 max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-md border border-black/10 px-4 py-3 text-sm"
                placeholder="Nombre"
              />
              <input
                className="rounded-md border border-black/10 px-4 py-3 text-sm"
                placeholder="Email"
              />
              <input
                className="rounded-md border border-black/10 px-4 py-3 text-sm md:col-span-2"
                placeholder="Asunto"
              />
              <textarea
                className="rounded-md border border-black/10 px-4 py-3 text-sm md:col-span-2"
                rows={5}
                placeholder="Mensaje"
              />
            </div>

            <button
              type="button"
              className="mt-5 w-full rounded-full bg-[#c7a457] px-6 py-3 text-sm font-semibold text-black hover:opacity-90"
            >
              Enviar
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
