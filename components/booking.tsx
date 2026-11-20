/* eslint-disable @next/next/no-img-element */
"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  MessageCircle,
  Scissors,
  Users,
} from "lucide-react";
import type { Barber, BarberService, Service } from "@/lib/types";
import type { AvailabilityResult } from "@/lib/availability-types";
import { dayLong, dayShort } from "@/lib/agenda";
import { formatPrice, timeLabel12 } from "@/lib/format";
import {
  createAppointment,
  type BookingState,
  type BookingSummary,
} from "@/app/reservar/actions";

type Mode = "service" | "barber";

const ANY = "any";
const MAX_SERVICES = 6;

type Props = {
  services: Service[];
  barbers: Barber[];
  barberServices: BarberService[];
  whatsapp: string;
  businessName: string;
};

type Fetched = { key: string; data?: AvailabilityResult; error?: string };

const initialState: BookingState = {};

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none transition focus:border-fg";

// Al terminar una reserva se vuelve a montar el flujo desde cero
export function Booking(props: Props) {
  const [round, setRound] = useState(0);
  return (
    <BookingFlow
      key={round}
      {...props}
      onReset={() => setRound((n) => n + 1)}
    />
  );
}

function BookingFlow({
  services,
  barbers,
  barberServices,
  whatsapp,
  businessName,
  onReset,
}: Props & { onReset: () => void }) {
  const [mode, setMode] = useState<Mode>("service");
  const [pickedServices, setPickedServices] = useState<string[]>([]);
  const [pickedBarber, setPickedBarber] = useState<string | null>(null);
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [pickedTime, setPickedTime] = useState<string | null>(null);
  const [openedAt, setOpenedAt] = useState(0);
  const [fetched, setFetched] = useState<Fetched | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [state, formAction, pending] = useActionState(
    createAppointment,
    initialState
  );

  // Si la hora se ocupó mientras reservaba, se vuelven a pedir los horarios
  const [seen, setSeen] = useState(0);
  const [nonce, setNonce] = useState(0);
  if (state.refresh && state.stamp && state.stamp !== seen) {
    setSeen(state.stamp);
    setNonce(nonce + 1);
  }

  // ---- Quién hace qué ----
  const linkMap = useMemo(
    () =>
      new Map(barberServices.map((l) => [`${l.barber_id}:${l.service_id}`, l])),
    [barberServices]
  );
  const noLinks = barberServices.length === 0; // sin asignaciones: todos hacen todo
  const offers = (b: string, s: string) => noLinks || linkMap.has(`${b}:${s}`);

  const quote = (b: string | null, list: Service[]) => {
    let minutes = 0;
    let price = 0;
    for (const s of list) {
      const l = b ? linkMap.get(`${b}:${s.id}`) : undefined;
      minutes += l?.minutes ?? s.minutes;
      price += l?.price ?? s.price;
    }
    return { minutes, price };
  };

  // ---- Barbero elegido (solo si sigue siendo válido) ----
  let barberId: string | null = null;
  if (pickedBarber === ANY && mode === "service") barberId = ANY;
  else if (pickedBarber && barbers.some((b) => b.id === pickedBarber))
    barberId = pickedBarber;

  // ---- Servicios que se pueden elegir ----
  const serviceOptions =
    mode === "service"
      ? services.filter((s) => barbers.some((b) => offers(b.id, s.id)))
      : barberId && barberId !== ANY
        ? services.filter((s) => offers(barberId, s.id))
        : [];

  const selected = serviceOptions.filter((s) => pickedServices.includes(s.id));

  // ---- Barberos que hacen TODO lo elegido ----
  const eligible =
    mode === "service" && selected.length > 0
      ? barbers.filter((b) => selected.every((s) => offers(b.id, s.id)))
      : [];

  const noCombo =
    mode === "service" && selected.length > 0 && eligible.length === 0;

  let activeBarber: string | null = barberId;
  if (mode === "service") {
    if (selected.length === 0) activeBarber = null;
    else if (activeBarber === ANY) {
      if (eligible.length < 2) activeBarber = null;
    } else if (activeBarber && !eligible.some((b) => b.id === activeBarber)) {
      activeBarber = null;
    }
  }

  const barberOptions = mode === "barber" ? barbers : eligible;
  const showAny = mode === "service" && eligible.length > 1;

  // ---- Horas disponibles (se piden al servidor) ----
  const reqKey =
    selected.length > 0 && activeBarber
      ? `${selected.map((s) => s.id).sort().join(",")}|${activeBarber}|${nonce}`
      : null;

  useEffect(() => {
    if (!reqKey) return;
    let cancelled = false;
    const [svc, barber] = reqKey.split("|");

    fetch(
      `/api/availability?services=${encodeURIComponent(svc)}&barber=${encodeURIComponent(barber)}`
    )
      .then(async (r) => {
        const data = (await r.json()) as AvailabilityResult;
        if (!r.ok) throw new Error(data.error ?? "error");
        if (!cancelled) setFetched({ key: reqKey, data });
      })
      .catch(() => {
        if (!cancelled)
          setFetched({
            key: reqKey,
            error: "No se pudieron cargar los horarios. Intenta de nuevo.",
          });
      });

    return () => {
      cancelled = true;
    };
  }, [reqKey]);

  // ---- Reserva guardada ----
  if (state.ok && state.summary) {
    return (
      <Confirmation
        summary={state.summary}
        whatsapp={whatsapp}
        businessName={businessName}
        onReset={onReset}
      />
    );
  }

  const loading = reqKey !== null && fetched?.key !== reqKey;
  const result = reqKey && fetched?.key === reqKey ? fetched : null;
  const dayKeys = result?.data ? Object.keys(result.data.days).sort() : [];

  const day = pickedDay && dayKeys.includes(pickedDay) ? pickedDay : null;
  const slots = day && result?.data ? result.data.days[day] : [];
  const slot = pickedTime ? slots.find((s) => s.t === pickedTime) : undefined;
  const time = slot?.t ?? null;

  // ---- Resumen ----
  const assigned = activeBarber === ANY ? (slot?.b[0] ?? null) : activeBarber;
  const quoteBarber =
    assigned ??
    (activeBarber && activeBarber !== ANY
      ? activeBarber
      : (eligible[0]?.id ?? null));
  const total = selected.length > 0 ? quote(quoteBarber, selected) : null;

  const barber = barbers.find((b) => b.id === activeBarber);
  const ready = Boolean(selected.length > 0 && activeBarber && day && time);

  const toggleService = (id: string) =>
    setPickedServices((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_SERVICES
          ? prev
          : [...prev, id]
    );

  // ---- Pasos ----
  const servicePicker = (
    <Step key="service" title="Servicios (puedes elegir varios)">
      {serviceOptions.length === 0 ? (
        <Hint>
          {mode === "barber" && !barberId
            ? "Elige un barbero para ver los servicios que hace."
            : "Por ahora no hay servicios disponibles."}
        </Hint>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {serviceOptions.map((s) => {
            const q = quote(mode === "barber" ? barberId : null, [s]);
            return (
              <Option
                key={s.id}
                active={selected.some((x) => x.id === s.id)}
                onClick={() => toggleService(s.id)}
              >
                                <div className="flex items-center gap-3 pr-5">
                  <Thumb
                    src={s.image_url}
                    alt={s.name}
                    size="h-14 w-14"
                    fallback={<Scissors size={18} />}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{s.name}</span>
                      <span className="shrink-0 text-sm font-medium">
                        {formatPrice(q.price)}
                      </span>
                    </div>
                    <span className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <Clock size={12} /> {q.minutes} min
                    </span>
                  </div>
                </div>
              </Option>
            );
          })}
        </div>
      )}
    </Step>
  );

  const barberPicker = (
    <Step key="barber" title="Barbero">
      {noCombo ? (
        <Hint>
          Ningún barbero hace todos esos servicios en una misma cita. Quita
          alguno o resérvalos en citas separadas.
        </Hint>
      ) : barberOptions.length === 0 ? (
        <Hint>Elige primero los servicios para ver qué barberos los hacen.</Hint>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {barberOptions.map((b) => (
            <Option
              key={b.id}
              active={activeBarber === b.id}
              onClick={() => setPickedBarber(b.id)}
            >
              <div className="flex items-center gap-3 pr-5">
                <Thumb
                  src={b.photo_url}
                  alt={b.name}
                  size="h-10 w-10"
                  round
                  fallback={b.name.charAt(0)}
                />
                <div className="min-w-0">
                  <span className="block truncate font-medium">{b.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {(b.specialties ?? []).join(" · ")}
                  </span>
                </div>
              </div>
            </Option>
          ))}
          {showAny && (
            <Option
              active={activeBarber === ANY}
              onClick={() => setPickedBarber(ANY)}
            >
              <div className="flex items-center gap-3 pr-5">
                <Thumb
                  src={null}
                  alt=""
                  size="h-10 w-10"
                  round
                  fallback={<Users size={16} />}
                />
                <div className="min-w-0">
                  <span className="block truncate font-medium">Cualquiera</span>
                  <span className="block truncate text-xs text-muted">
                    El primero disponible
                  </span>
                </div>
              </div>
            </Option>
          )}
        </div>
      )}
    </Step>
  );

  const dateTimePicker = (
    <Step key="when" title="Fecha y hora">
      {!reqKey ? (
        <Hint>
          Elige los servicios y el barbero para ver los horarios disponibles.
        </Hint>
      ) : loading ? (
        <Hint>Buscando horarios…</Hint>
      ) : result?.error || result?.data?.error ? (
        <Hint>{result.error ?? result.data?.error}</Hint>
      ) : dayKeys.length === 0 ? (
        <Hint>
          No hay horarios disponibles en los próximos días con esta
          combinación. Prueba con otro barbero o con menos servicios.
        </Hint>
      ) : (
        <>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
            {dayKeys.map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => setPickedDay(k)}
                className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm capitalize transition ${
                  day === k
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-line bg-surface hover:border-fg"
                }`}
              >
                {dayShort(k)}
              </button>
            ))}
          </div>

          {day ? (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.t}
                  onClick={() => {
                    setPickedTime(s.t);
                    setOpenedAt(Date.now());
                  }}
                  className={`rounded-xl border py-2.5 text-sm transition ${
                    time === s.t
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line bg-surface hover:border-fg"
                  }`}
                >
                  {timeLabel12(s.t)}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Elige un día.</p>
          )}
        </>
      )}
    </Step>
  );

  const detailsStep =
    day && time ? (
      <Step key="details" title="Tus datos">
        <div className="space-y-3">
          <Field label="Nombre">
            <input
              name="name"
              required
              minLength={2}
              maxLength={60}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Celular (WhatsApp)">
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              placeholder="300 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Nota (opcional)">
            <input
              name="notes"
              maxLength={200}
              placeholder="Ej. quiero el mismo corte de la vez pasada"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </Field>

          {/* Campo trampa: las personas no lo ven, los bots sí lo llenan */}
          <div
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
          >
            <label>
              Sitio web
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <p className="text-xs text-muted">
            Usaremos tu número solo para confirmar tu cita.
          </p>
        </div>
      </Step>
    ) : null;

  return (
    <form
      action={formAction}
      className="grid gap-8 lg:grid-cols-[1fr_340px]"
    >
      <input
        type="hidden"
        name="services"
        value={selected.map((s) => s.id).join(",")}
      />
      <input type="hidden" name="barber" value={activeBarber ?? ""} />
      <input type="hidden" name="day" value={day ?? ""} />
      <input type="hidden" name="time" value={time ?? ""} />
      <input type="hidden" name="opened" value={String(openedAt)} />

      <div className="min-w-0 space-y-8">
        <div className="grid w-full grid-cols-2 rounded-full border border-line bg-surface p-1 sm:inline-grid sm:w-auto">
          {(
            [
              ["service", "Por servicio"],
              ["barber", "Por barbero"],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
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
          ? [servicePicker, barberPicker, dateTimePicker, detailsStep]
          : [barberPicker, servicePicker, dateTimePicker, detailsStep]}
      </div>

      <aside className="h-fit rounded-2xl border border-line bg-surface p-6 lg:sticky lg:top-24">
        <h3 className="font-display text-xl">Tu cita</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <Row
            label={selected.length > 1 ? "Servicios" : "Servicio"}
            value={
              selected.length > 0
                ? selected.map((s) => s.name).join(" + ")
                : undefined
            }
          />
          <Row
            label="Barbero"
            value={
              activeBarber === ANY ? "Cualquiera disponible" : barber?.name
            }
          />
          <Row label="Fecha" value={day ? dayLong(day) : undefined} />
          <Row label="Hora" value={time ? timeLabel12(time) : undefined} />
          <div className="space-y-3 border-t border-line pt-3">
            <Row
              label="Total"
              value={total ? formatPrice(total.price) : undefined}
            />
            <Row
              label="Duración"
              value={total ? `${total.minutes} min` : undefined}
            />
          </div>
        </dl>

        {state.error && (
          <p role="alert" className="mt-4 text-sm text-red-500">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={!ready || pending}
          className={`mt-6 w-full rounded-full py-3.5 text-sm font-medium transition ${
            ready
              ? "bg-accent text-accent-fg hover:opacity-90 disabled:opacity-60"
              : "cursor-not-allowed bg-line text-muted"
          }`}
        >
          {pending ? "Enviando…" : "Solicitar cita"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          Tu cita queda pendiente hasta que el barbero la confirme.
        </p>
      </aside>
    </form>
  );
}

function Confirmation({
  summary,
  whatsapp,
  businessName,
  onReset,
}: {
  summary: BookingSummary;
  whatsapp: string;
  businessName: string;
  onReset: () => void;
}) {
  const text =
    `Hola, soy ${summary.name}. Acabo de solicitar una cita en ${businessName}: ` +
    `${summary.services.join(", ")} con ${summary.barberName}, ` +
    `${dayLong(summary.day)} a las ${timeLabel12(summary.time)}.`;

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-line bg-bg p-8 text-center">
      <CheckCircle2 size={44} className="mx-auto" />
      <div className="space-y-2">
        <h3 className="font-display text-3xl">¡Solicitud enviada!</h3>
        <p className="text-sm text-muted">
          Tu cita quedó <strong className="text-fg">pendiente</strong>.{" "}
          {summary.barberName} la confirmará pronto y te escribirá al{" "}
          {summary.phone}.
        </p>
      </div>

      <dl className="space-y-3 rounded-xl border border-line bg-surface p-5 text-left text-sm">
        <Row label="Servicios" value={summary.services.join(" + ")} />
        <Row label="Barbero" value={summary.barberName} />
        <Row label="Fecha" value={dayLong(summary.day)} />
        <Row label="Hora" value={timeLabel12(summary.time)} />
        <div className="space-y-3 border-t border-line pt-3">
          <Row label="Total" value={formatPrice(summary.price)} />
          <Row label="Duración" value={`${summary.minutes} min`} />
        </div>
      </dl>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition hover:opacity-90"
          >
            <MessageCircle size={16} /> Escribir por WhatsApp
          </a>
        )}
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-line px-6 py-3 text-sm transition hover:border-fg"
        >
          Hacer otra reserva
        </button>
      </div>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs uppercase tracking-widest text-muted">
        {label}
      </label>
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
      type="button"
      onClick={onClick}
      aria-pressed={active}
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
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right font-medium">{value ?? "—"}</dd>
    </div>
  );
}

function Thumb({
  src,
  alt,
  size,
  round = false,
  fallback,
}: {
  src: string | null;
  alt: string;
  size: string;
  round?: boolean;
  fallback: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-line bg-bg font-display text-muted ${size} ${
        round ? "rounded-full" : "rounded-lg"
      }`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        fallback
      )}
    </div>
  );
}