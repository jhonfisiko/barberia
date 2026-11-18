import Link from "next/link";
import { connection } from "next/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  AppointmentCard,
  type CardAppt,
} from "@/components/appointment-card";
import { getOwnBarber } from "@/lib/barber";
import { createClient } from "@/lib/supabase/server";
import {
  addDays,
  blockRangeForDay,
  dateValue,
  dayBounds,
  dayLong,
  dayShort,
  isKey,
  overlaps,
  phoneForWhatsApp,
  timeLabel,
  todayKey,
  weekdayOf,
  weekKeys,
  type Appt,
  type Block,
  type HourRow,
} from "@/lib/agenda";
import { formatPrice } from "@/lib/format";

const href = (d: string, v: string) => `/panel/agenda?d=${d}&v=${v}`;

const DOT: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-emerald-500",
  cancelled: "bg-muted",
  done: "bg-muted",
};

function whatsappMessage(
  a: Appt,
  biz: string,
  barberName: string,
  services: string
) {
  const dateLabel = dayLong(dateValue(a.starts_at));
  const time = timeLabel(a.starts_at);
  const first = a.customer_name.split(" ")[0];

  if (a.status === "pending")
    return `Hola ${first}, recibimos tu solicitud de cita en ${biz}: ${services} con ${barberName}, ${dateLabel} a las ${time}. Te confirmamos en breve.`;
  if (a.status === "confirmed")
    return `Hola ${first}, tu cita en ${biz} está confirmada: ${services} con ${barberName}, ${dateLabel} a las ${time}. ¡Te esperamos!`;
  if (a.status === "cancelled")
    return `Hola ${first}, lamentamos avisarte que tuvimos que cancelar tu cita del ${dateLabel} a las ${time}${
      a.cancel_reason ? `. Motivo: ${a.cancel_reason}` : ""
    }. Escríbenos y la reagendamos.`;
  return "";
}

function toCard(a: Appt, biz: string, barberName: string): CardAppt {
  const services =
    (a.appointment_services ?? []).map((s) => s.service_name).join(" + ") ||
    "Servicio";
  const total =
    a.total_price ??
    (a.appointment_services ?? []).reduce((sum, s) => sum + s.price, 0);

  const phone = phoneForWhatsApp(a.customer_phone);
  const msg = whatsappMessage(a, biz, barberName, services);

  return {
    id: a.id,
    status: a.status,
    customer: a.customer_name,
    phone: a.customer_phone,
    services,
    price: formatPrice(total),
    timeRange: `${timeLabel(a.starts_at)} – ${timeLabel(a.ends_at)}`,
    dateValue: dateValue(a.starts_at),
    timeValue: timeLabel(a.starts_at),
    notes: a.notes,
    cancelReason: a.cancel_reason,
    waUrl:
      phone && msg
        ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
        : null,
  };
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; v?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const { barber } = await getOwnBarber();

  const header = (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-muted">Agenda</p>
      <h1 className="mt-2 font-display text-3xl md:text-4xl">Mi agenda</h1>
      <p className="mt-2 text-sm text-muted">
        Tus citas, tus bloqueos y tu horario en un solo lugar.
      </p>
    </div>
  );

  if (!barber) {
    return (
      <div className="space-y-8">
        {header}
        <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
          Tu cuenta aún no está vinculada a un barbero. Pídele al administrador
          que la conecte.
        </div>
      </div>
    );
  }

  const today = todayKey();
  const view = sp.v === "week" ? "week" : "day";
  const date = isKey(sp.d) ? sp.d : today;
  const keys = view === "week" ? weekKeys(date) : [date];
  const rangeStart = dayBounds(keys[0]).start;
  const rangeEnd = dayBounds(keys[keys.length - 1]).end;
  const nowIso = new Date().toISOString();

  const supabase = await createClient();
  const [apptsRes, blocksRes, hoursRes, settingsRes, pendingRes] =
    await Promise.all([
      supabase
        .from("appointments")
        .select(
          "id,customer_name,customer_phone,starts_at,ends_at,status,notes,cancel_reason,total_price,appointment_services(service_name,minutes,price)"
        )
        .eq("barber_id", barber.id)
        .lt("starts_at", rangeEnd.toISOString())
        .gt("ends_at", rangeStart.toISOString())
        .order("starts_at"),
      supabase
        .from("time_blocks")
        .select("id,reason,starts_at,ends_at")
        .eq("barber_id", barber.id)
        .lt("starts_at", rangeEnd.toISOString())
        .gt("ends_at", rangeStart.toISOString())
        .order("starts_at"),
      supabase
        .from("barber_hours")
        .select("weekday,start_time,end_time")
        .eq("barber_id", barber.id),
      supabase.from("business_settings").select("name").eq("id", 1).maybeSingle(),
      supabase
        .from("appointments")
        .select("id,customer_name,starts_at")
        .eq("barber_id", barber.id)
        .eq("status", "pending")
        .gte("ends_at", nowIso)
        .order("starts_at")
        .limit(6),
    ]);

  const appts = (apptsRes.data ?? []) as unknown as Appt[];
  const blocks = (blocksRes.data ?? []) as Block[];
  const hours = (hoursRes.data ?? []) as HourRow[];
  const biz = (settingsRes.data?.name as string | null) ?? "la barbería";
  const pending = pendingRes.data ?? [];

  const days = keys.map((key) => {
    const { start, end } = dayBounds(key);
    const wd = weekdayOf(key);
    const tramos = hours
      .filter((h) => h.weekday === wd)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map((h) => `${h.start_time.slice(0, 5)}–${h.end_time.slice(0, 5)}`);

    const items = [
      ...appts
        .filter((a) => overlaps(a.starts_at, a.ends_at, start, end))
        .map((a) => ({ kind: "appt" as const, at: a.starts_at, appt: a })),
      ...blocks
        .filter((b) => overlaps(b.starts_at, b.ends_at, start, end))
        .map((b) => ({ kind: "block" as const, at: b.starts_at, block: b })),
    ].sort((x, y) => new Date(x.at).getTime() - new Date(y.at).getTime());

    return { key, start, end, tramos, items };
  });

  const step = view === "week" ? 7 : 1;
  const title =
    view === "week"
      ? `${dayShort(keys[0])} – ${dayShort(keys[6])}`
      : dayLong(date);

  const iconBtn =
    "flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface transition hover:border-fg";

  return (
    <div className="space-y-8">
      {header}

      {pending.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-amber-500/40 bg-surface p-5">
          <p className="font-medium">
            Tienes {pending.length === 6 ? "6 o más" : pending.length}{" "}
            {pending.length === 1 ? "cita" : "citas"} por aceptar
          </p>
          <div className="flex flex-wrap gap-2">
            {pending.map((p) => (
              <Link
                key={p.id}
                href={href(dateValue(p.starts_at), "day")}
                className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-fg"
              >
                {dayShort(dateValue(p.starts_at))} · {timeLabel(p.starts_at)} ·{" "}
                {p.customer_name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={href(addDays(date, -step), view)}
            aria-label="Anterior"
            className={iconBtn}
          >
            <ChevronLeft size={18} />
          </Link>
          <Link
            href={href(today, view)}
            className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm transition hover:border-fg"
          >
            Hoy
          </Link>
          <Link
            href={href(addDays(date, step), view)}
            aria-label="Siguiente"
            className={iconBtn}
          >
            <ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-2 rounded-full border border-line bg-surface p-1">
          {(
            [
              ["day", "Día"],
              ["week", "Semana"],
            ] as const
          ).map(([v, label]) => (
            <Link
              key={v}
              href={href(date, v)}
              className={`rounded-full px-5 py-2 text-center text-sm transition ${
                view === v
                  ? "bg-accent text-accent-fg"
                  : "text-muted hover:text-fg"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <h2 className="font-display text-2xl first-letter:uppercase">{title}</h2>

      {view === "day" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {days[0].tramos.length > 0
              ? `Tu horario: ${days[0].tramos.join(" · ")}`
              : "No tienes horario este día."}
          </p>

          {days[0].items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-6 text-sm text-muted">
              No tienes citas ni bloqueos este día.
            </p>
          ) : (
            days[0].items.map((item) =>
              item.kind === "appt" ? (
                <AppointmentCard
                  key={item.appt.id}
                  appt={toCard(item.appt, biz, barber.name)}
                  today={today}
                />
              ) : (
                <div
                  key={item.block.id}
                  className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted"
                >
                  <p className="font-medium text-fg">
                    {blockRangeForDay(item.block, days[0].start, days[0].end)}
                  </p>
                  <p>Bloqueado · {item.block.reason ?? "Bloqueo"}</p>
                </div>
              )
            )
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((d) => (
            <div
              key={d.key}
              className={`min-w-0 space-y-2 rounded-2xl border bg-surface p-3 ${
                d.key === today ? "border-accent" : "border-line"
              }`}
            >
              <Link href={href(d.key, "day")} className="block">
                <p className="text-xs uppercase tracking-widest text-muted">
                  {dayShort(d.key)}
                </p>
              </Link>

              {d.items.length === 0 && (
                <p className="text-xs text-muted">
                  {d.tramos.length > 0 ? "Libre" : "Sin horario"}
                </p>
              )}

              {d.items.map((item) =>
                item.kind === "appt" ? (
                  <Link
                    key={item.appt.id}
                    href={href(d.key, "day")}
                    className={`block rounded-lg border border-line bg-bg px-2.5 py-2 text-xs ${
                      item.appt.status === "cancelled" ? "opacity-50" : ""
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          DOT[item.appt.status] ?? "bg-muted"
                        }`}
                      />
                      {timeLabel(item.appt.starts_at)}
                    </span>
                    <span
                      className={`block truncate text-muted ${
                        item.appt.status === "cancelled" ? "line-through" : ""
                      }`}
                    >
                      {item.appt.customer_name}
                    </span>
                  </Link>
                ) : (
                  <div
                    key={item.block.id}
                    className="rounded-lg border border-dashed border-line px-2.5 py-2 text-xs text-muted"
                  >
                    <span className="block">
                      {blockRangeForDay(item.block, d.start, d.end)}
                    </span>
                    <span className="block truncate">
                      {item.block.reason ?? "Bloqueo"}
                    </span>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}