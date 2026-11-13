import { Clock, MapPin, MessageCircle, Scissors, Star } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Booking } from "@/components/booking";
import { BARBERS, BUSINESS, SERVICES, formatPrice } from "@/lib/data";

const waLink = `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(
  `Hola, quiero información de ${BUSINESS.name}`
)}`;

export default function Home() {
  const popular = SERVICES.filter((s) => s.popular);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#" className="font-display text-lg tracking-tight">
            Woeaco <span className="text-muted">Barber Estudio</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
            <a href="#populares" className="hover:text-fg">Lo más pedido</a>
            <a href="#servicios" className="hover:text-fg">Servicios</a>
            <a href="#barberos" className="hover:text-fg">Barberos</a>
            <a href="#trabajos" className="hover:text-fg">Trabajos</a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="#reservar"
              className="hidden rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90 sm:block"
            >
              Reservar
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 py-20 md:py-32">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted">
            Barbería · Estudio
          </p>
          <h1 className="font-display text-5xl leading-[1.05] md:text-7xl">
            El corte que
            <br />
            te define.
          </h1>
          <p className="mt-6 max-w-md text-muted">
            Elige tu servicio o tu barbero favorito y agenda tu cita en
            menos de un minuto.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#reservar"
              className="rounded-full bg-accent px-7 py-3 text-sm font-medium text-accent-fg transition hover:opacity-90"
            >
              Agendar cita
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full border border-line px-7 py-3 text-sm transition hover:border-fg"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
            <span className="flex items-center gap-2">
              <Clock size={14} /> {BUSINESS.hours}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={14} /> {BUSINESS.address}
            </span>
          </div>
        </section>

        {/* Lo más pedido */}
        <section id="populares" className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <SectionTitle eyebrow="Favoritos" title="Lo más pedido" />
            <div className="grid gap-4 md:grid-cols-3">
              {popular.map((s, i) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-line bg-bg p-6"
                >
                  <div className="flex items-center justify-between text-muted">
                    <span className="font-display text-3xl text-fg">
                      0{i + 1}
                    </span>
                    <Star size={16} />
                  </div>
                  <h3 className="mt-6 text-lg font-medium">{s.name}</h3>
                  <p className="mt-1 text-sm text-muted">{s.description}</p>
                  <div className="mt-5 flex items-center justify-between text-sm">
                    <span className="text-muted">{s.minutes} min</span>
                    <span className="font-medium">{formatPrice(s.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Servicios */}
        <section id="servicios" className="mx-auto max-w-6xl px-5 py-20">
          <SectionTitle eyebrow="Carta" title="Servicios" />
          <ul className="divide-y divide-line border-y border-line">
            {SERVICES.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-4 py-5"
              >
                <div className="flex items-start gap-4">
                  <Scissors size={18} className="mt-1 text-muted" />
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-muted">{s.description}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium">{formatPrice(s.price)}</p>
                  <p className="text-xs text-muted">{s.minutes} min</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Barberos */}
        <section
          id="barberos"
          className="border-y border-line bg-surface"
        >
          <div className="mx-auto max-w-6xl px-5 py-20">
            <SectionTitle eyebrow="El equipo" title="Nuestros barberos" />
            <div className="grid gap-6 md:grid-cols-2">
              {BARBERS.map((b) => (
                <div
                  key={b.id}
                  className="flex gap-5 rounded-2xl border border-line bg-bg p-6"
                >
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-line to-muted/40 font-display text-3xl">
                    {b.name.slice(-1)}
                  </div>
                  <div>
                    <h3 className="font-display text-2xl">{b.name}</h3>
                    <p className="text-xs uppercase tracking-widest text-muted">
                      {b.role}
                    </p>
                    <p className="mt-3 text-sm text-muted">{b.bio}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {b.specialties.map((sp) => (
                        <span
                          key={sp}
                          className="rounded-full border border-line px-3 py-1 text-xs"
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trabajos */}
        <section id="trabajos" className="mx-auto max-w-6xl px-5 py-20">
          <SectionTitle eyebrow="Portafolio" title="Trabajos de cada barbero" />
          <div className="space-y-12">
            {BARBERS.map((b) => (
              <div key={b.id}>
                <h3 className="mb-4 font-display text-xl">{b.name}</h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {b.works.map((w, i) => (
                    <div
                      key={w.id}
                      className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-gradient-to-br from-line to-muted/30"
                      style={{ filter: `brightness(${1 - i * 0.04})` }}
                    >
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-sm text-white">
                        {w.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted">
            * Espacios de ejemplo: aquí irán las fotos reales de cada barbero.
          </p>
        </section>

        {/* Reservar */}
        <section
          id="reservar"
          className="border-t border-line bg-surface"
        >
          <div className="mx-auto max-w-6xl px-5 py-20">
            <SectionTitle eyebrow="Agenda" title="Reserva tu cita" />
            <Booking />
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-8 text-sm text-muted md:flex-row">
               <span>© 2026 {BUSINESS.name}</span>
              <a href={waLink} target="_blank" rel="noreferrer" className="hover:text-fg">
            Escríbenos por WhatsApp
          </a>
        </div>
      </footer>
    </>
  );
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-10">
      <p className="mb-2 text-xs uppercase tracking-[0.3em] text-muted">
        {eyebrow}
      </p>
      <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
    </div>
  );
}