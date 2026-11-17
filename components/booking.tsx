"use client";

import { useMemo, useState } from "react";
import { Check, Clock, MessageCircle } from "lucide-react";
import type { Barber, BarberService, Service } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useMounted } from "@/lib/use-mounted";

type Mode = "service" | "barber";

const ANY = "cualquiera";

function buildDays(closedDays: number[]) {
  const list: Date[] = [];
  const d = new Date();
  let guard = 0;
  while (list.length < 7 && guard < 30) {
    if (!closedDays.includes(d.getDay())) list.push(new Date(d));
    d.setDate(d.getDate() + 1);
    guard++;
  }
  return list;
}

function dayLabel(d: Date) {
  return d.toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

type Props = {
  services: Service[];
  barbers: Barber[];
  barberServices: BarberService[];
  times: string[];
  closedDays: number[];
  whatsapp: string;
  businessName: string;
};

export function Booking({
  services,
  barbers,
  barberServices,
  times,
  closedDays,
  whatsapp,
  businessName,
}: Props) {
  const [mode, setMode] = useState<Mode>("service");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const mounted = useMounted();
  const days = useMemo(
    () => (mounted ? buildDays(closedDays) : []),
    [mounted, closedDays]
  );

  // ---- Quién hace qué ----
  const links = useMemo(() => {
    const map = new Map<string, BarberService>();
    for (const l of barberServices) map.set(`${l.barber_id}:${l.service_id}`, l);
    return map;
  }, [barberServices]);

  // Si todavía no hay asignaciones, se asume que todos hacen todo
  const offers = (barber: string, service: string) =>
    barberServices.length === 0 || links.has(`${barber}:${service}`);

  const barbersFor = (service: string) =>
    barbers.filter((b) => offers(b.id, service));

  const details = (s: Service, barber: string | null) => {
    const link =
      barber && barber !== ANY ? links.get(`${barber}:${s.id}`) : undefined;
    return {
      minutes: link?.minutes ?? s.minutes,
      price: link?.price ?? s.price,
    };
  };

  // ---- Selección válida (se descarta lo que ya no es compatible) ----
  const serviceRaw = services.find((s) => s.id === serviceId);
  const barberKnown =
    barberId === ANY || barbers.some((b) => b.id === barberId);

  let service: Service | undefined;
  let activeBarber: string | null = null;

  if (mode === "service") {
    service =
      serviceRaw && barbersFor(serviceRaw.id).length > 0
        ? serviceRaw
        : undefined;
    if (service && barberId && barberKnown) {
      const ok = barberId === ANY || offers(barberId, service.id);
      activeBarber = ok ? barberId : null;
    }
  } else {
    if (barberId && barberKnown) activeBarber = barberId;
    if (serviceRaw && activeBarber) {
      const ok =
        activeBarber === ANY
          ? barbersFor(serviceRaw.id).length > 0
          : offers(activeBarber, serviceRaw.id);
      service = ok ? serviceRaw : undefined;
    }
  }

  const ab = activeBarber;
  const barber =
    ab && ab !== ANY ? barbers.find((b) => b.id === ab) : undefined;
  const eff = service ? details(service, ab) : null;

  const ready = Boolean(service && ab && dayIndex !== null && time);

  let whatsappUrl = "#";
  if (service && ab && dayIndex !== null && time && whatsapp && eff) {
    const who = barber ? barber.name : "cualquier barbero disponible";
    const msg =
      `Hola, quiero agendar en ${businessName}:\n` +
      `• Servicio: ${service.name} (${eff.minutes} min · ${formatPrice(eff.price)})\n` +
      `• Barbero: ${who}\n` +
      `• Fecha: ${dayLabel(days[dayIndex])}\n` +
      `• Hora: ${time}\n` +
      `¿Está disponible?`;
    whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
  }

  // ---- Opciones visibles en cada paso ----
  const anyoneDoes = services.filter((s) => barbersFor(s.id).length > 0);

  const serviceOptions =
    mode === "service"
      ? anyoneDoes
      : ab === null
        ? []
        : ab === ANY
          ? anyoneDoes
          : services.filter((s) => offers(ab, s.id));

  const barberOptions =
    mode === "barber" ? barbers : service ? barbersFor(service.id) : [];
  const showAny = barberOptions.length > 1;

  const servicePicker = (
    <Step key="service" title="Servicio">
      {serviceOptions.length === 0 ? (
        <Hint>
          {mode === "barber" && ab === null
            ? "Elige un barbero para ver los servicios que hace."
            : "Por ahora no hay servicios disponibles."}
        </Hint>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {serviceOptions.map((s) => {
            const d = details(s, mode === "barber" ? ab : null);
            return (
              <Option
                key={s.id}
                active={service?.id === s.id}
                onClick={() => setServiceId(s.id)}
              >
                <div className="flex items-start justify-between gap-2 pr-5">
                  <span className="font-medium">{s.name}</span>
                  <span className="shrink-0 text-sm font-medium">
                    {formatPrice(d.price)}
                  </span>
                </div>
                <span className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <Clock size={12} /> {d.minutes} min
                </span>
              </Option>
            );
          })}
        </div>
      )}
    </Step>
  );

  const barberPicker = (
    <Step key="barber" title="Barbero">
      {barberOptions.length === 0 ? (
        <Hint>
          {mode === "service" && !service
            ? "Elige un servicio para ver los barberos que lo hacen."
            : "Por ahora no hay barberos disponibles."}
        </Hint>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {barberOptions.map((b) => (
            <Option
              key={b.id}
              active={ab === b.id}
              onClick={() => setBarberId(b.id)}
            >
              <span className="font-medium">{b.name}</span>
              <span className="text-xs text-muted">
                {(b.specialties ?? []).join(" · ")}
              </span>
            </Option>
          ))}
          {showAny && (
            <Option active={ab === ANY} onClick={() => setBarberId(ANY)}>
              <span className="font-medium">Cualquiera</span>
              <span className="text-xs text-muted">El primero disponible</span>
            </Option>
          )}
        </div>
      )}
    </Step>
  );

  const dateTimePicker = (
    <Step key="when" title="Fecha y hora">
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
        {days.map((d, i) => (
          <button
            key={i}
            onClick={() => setDayIndex(i)}
            className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm capitalize transition ${
              dayIndex === i
                ? "border-accent bg-accent text-accent-fg"
                : "border-line bg-surface hover:border-fg"
            }`}
          >
            {dayLabel(d)}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
        {times.map((t) => (
          <button
            key={t}
            onClick={() => setTime(t)}
            className={`rounded-xl border py-2.5 text-sm transition ${
              time === t
                ? "border-accent bg-accent text-accent-fg"
                : "border-line bg-surface hover:border-fg"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </Step>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-8">
        <div className="grid w-full grid-cols-2 rounded-full border border-line bg-surface p-1 sm:inline-grid sm:w-auto">
          {(
            [
              ["service", "Por servicio"],
              ["barber", "Por barbero"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`rounded-full px-5 py-2.5 text-sm transition ${
                mode === value
                  ? "bg-accent text-accent-fg"
                  : "text-muted hover:text-fg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "service"
          ? [servicePicker, barberPicker, dateTimePicker]
          : [barberPicker, servicePicker, dateTimePicker]}
      </div>

      <aside className="h-fit rounded-2xl border border-line bg-surface p-6 lg:sticky lg:top-24">
        <h3 className="font-display text-xl">Tu cita</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Servicio" value={service?.name} />
          <Row
            label="Barbero"
            value={ab === ANY ? "Cualquiera disponible" : barber?.name}
          />
          <Row
            label="Fecha"
            value={dayIndex !== null ? dayLabel(days[dayIndex]) : undefined}
          />
          <Row label="Hora" value={time ?? undefined} />
          <div className="space-y-3 border-t border-line pt-3">
            <Row
              label="Total"
              value={eff ? formatPrice(eff.price) : undefined}
            />
            <Row
              label="Duración"
              value={eff ? `${eff.minutes} min` : undefined}
            />
          </div>
        </dl>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!ready}
          className={`mt-6 flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium transition ${
            ready
              ? "bg-accent text-accent-fg hover:opacity-90"
              : "pointer-events-none bg-line text-muted"
          }`}
        >
          <MessageCircle size={16} /> Confirmar por WhatsApp
        </a>
      </aside>
    </div>
  );
}

function Step({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
      {children}
    </p>
  );
}

function Option({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col gap-0.5 rounded-xl border p-4 text-left transition ${
        active
          ? "border-accent bg-surface ring-1 ring-accent"
          : "border-line bg-surface hover:border-fg"
      }`}
    >
      {active && <Check size={14} className="absolute right-3 top-3 text-fg" />}
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value ?? "—"}</dd>
    </div>
  );
}