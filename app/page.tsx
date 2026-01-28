type Evento = {
  id: string;
  titulo: string;
  ciudad: string;
  categoria: string;
  fechaISO: string;
  lugar: string;
  imagen: string;
};

function fechaParts(fechaISO: string) {
  const d = new Date(fechaISO);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = d.toLocaleString("es-ES", { month: "short" }).replace(".", "");
  return { dia, mes };
}

function fechaLarga(fechaISO: string) {
  const d = new Date(fechaISO);
  const fecha = d
    .toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(".", "");
  const hora = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${fecha} ${hora} h`;
}

async function getEventos(): Promise<Evento[]> {
  const res = await fetch("http://localhost:3000/api/eventos", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.eventos ?? [];
}

export default async function EventosPage() {
  const eventos = await getEventos();

  return (
    <main className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Eventos</h1>
        </header>

        <div className="mb-10 grid gap-4 md:grid-cols-2">
          <select className="w-full rounded-md border border-black/10 bg-white px-4 py-3 text-sm">
            <option>Todas las ciudades</option>
          </select>

          <select className="w-full rounded-md border border-black/10 bg-white px-4 py-3 text-sm">
            <option>Todas las Categorías</option>
          </select>
        </div>

        <section className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {eventos.map((e) => {
            const { dia, mes } = fechaParts(e.fechaISO);
            return (
              <article key={e.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="relative overflow-hidden">
                  <div className="aspect-[16/9] w-full bg-black/5">
                    <img src={e.imagen} alt={e.titulo} className="h-full w-full object-cover" />
                  </div>

                  <div className="absolute left-4 top-4 rounded-xl bg-white px-3 py-2 text-center shadow">
                    <div className="text-lg font-semibold leading-none">{dia}</div>
                    <div className="text-xs lowercase text-black/70">{mes}</div>
                  </div>

                  <div className="absolute right-4 top-4 text-xs font-semibold tracking-wide text-white/90 drop-shadow">
                    GRUPO VÍA
                  </div>
                </div>

                <div className="p-6">
                  <h2 className="text-sm font-extrabold uppercase leading-snug tracking-tight">
                    {e.titulo}
                  </h2>

                  <div className="mt-5 space-y-3 text-sm text-black/75">
                    <div className="flex items-start gap-3">
                      <span aria-hidden className="mt-[2px]">🕒</span>
                      <span>{fechaLarga(e.fechaISO)}</span>
                    </div>

                    <div className="flex items-start gap-3">
                      <span aria-hidden className="mt-[2px]">📍</span>
                      <span>{e.lugar}</span>
                    </div>

                    <div className="pt-1 font-semibold text-black/80">{e.ciudad}</div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
