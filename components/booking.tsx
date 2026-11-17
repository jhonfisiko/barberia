"use client";

import { useMemo, useState } from "react";
import { Check, Clock, MessageCircle } from "lucide-react";
import type { Barber, Service } from "@/lib/types";
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
  times: string[];
  closedDays: number[];
  whatsapp: string;
  businessName: string;
};

export function Booking({
  services,
  barbers,
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

  const service = services.find((s) => s.id === serviceId);
  const barber = barbers.find((b) => b.id === barberId);

  const ready = Boolean(service && barberId && dayIndex !== null && time);

  const whatsappUrl = useMemo(() => {
    if (!service || !barberId || dayIndex === null || !time || !whatsapp)
      return "#";
    const who = barber ? barber.name : "cualquier barbero disponible";
    const msg =
      `Hola, quiero agendar en ${businessName}:\n` +
      `• Servicio: ${service.name} (${service.minutes} min · ${formatPrice(service.price)})\n` +
      `• Barbero: ${who}\n` +
      `• Fecha: ${dayLabel(days[dayIndex])}\n` +
      `• Hora: ${time}\n` +
      `¿Está disponible?`;
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
  }, [service, barber, barberId, dayIndex, time, days, whatsapp, businessName]);

  const servicePicker = (
    <Step key="service" title="Servicio">
      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((s) => (
          <Option
            key={s.id}
            active={serviceId === s.id}
            onClick={() => setServiceId(s.id)}
          >
            <div className="flex items-start justify-between gap-2 pr-5">
              <span className="font-medium">{s.name}</span>
              <span className="shrink-0 text-sm font-medium">
                {formatPrice(s.price)}
              </span>
            </div>
            <span className="mt-1 flex items-center gap-1 text-xs text-muted">
              <Clock size={12} /> {s.minutes} min
            </span>
          </Option>
        ))}
      </div>
    </Step>
  );

  const barberPicker = (
    <Step key="barber" title="Barbero">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {barbers.map((b) => (
          <Option
            key={b.id}
            active={barberId === b.id}
            onClick={() => setBarberId(b.id)}
          >
            <span className="font-medium">{b.name}</span>
            <span className="text-xs text-muted">
              {(b.specialties ?? []).join(" · ")}
            </span>
          </Option>
        ))}
        <Option active={barberId === ANY} onClick={() => setBarberId(ANY)}>
          <span className="font-medium">Cualquiera</span>
          <span className="text-xs text-muted">El primero disponible</span>
        </Option>
      </div>
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
            value={barberId === ANY ? "Cualquiera disponible" : barber?.name}
          />
          <Row
            label="Fecha"
            value={dayIndex !== null ? dayLabel(days[dayIndex]) : undefined}
          />
          <Row label="Hora" value={time ?? undefined} />
          <div className="space-y-3 border-t border-line pt-3">
            <Row
              label="Total"
              value={service ? formatPrice(service.price) : undefined}
            />
            <Row
              label="Duración"
              value={service ? `${service.minutes} min` : undefined}
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