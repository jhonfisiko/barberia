import Link from "next/link";
import { connection } from "next/server";
import { AgendaControls } from "@/components/agenda-controls";
import { AgendaGrid } from "@/components/agenda-grid";
import { buildColumn } from "@/lib/agenda-grid";
import { createClient } from "@/lib/supabase/server";
import {
  currentTimeMs,
  dateValue,
  dayBounds,
  dayLong,
  dayShort,
  isKey,
  timeLabel,
  todayKey,
  weekKeys,
  type Appt,
  type Block,
  type HourRow,
} from "@/lib/agenda";

type AdminAppt = Appt & { barber_id: string };
type AdminBlock = Block & { barber_id: string };
type AdminHour = HourRow & { barber_id: string };

export default async function CitasPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; v?: string; b?: string }>;
}) {
  await connection();
  const sp = await searchParams;
  const supabase = await createClient();

  const header = (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-muted">Agenda</p>
      <h1 className="mt-2 font-display text-3xl md:text-4xl">Citas</h1>
      <p className="mt-2 text-sm text-muted">
        Todas las citas de todos los barberos. Toca una para aceptarla,
        aplazarla o cancelarla. Las zonas verdes son huecos libres.
      </p>
    </div>
  );

  const { data: barbersData } = await supabase
    .from("barbers")
    .select("id,name")
    .eq("active", true)
    .order("sort_order");
  const barbers = (barbersData ?? []) as { id: string; name: string }[];

  if (barbers.length === 0) {
    return (
      <div className="space-y-8">
        {header}
        <p className="text-sm text-muted">
          Primero crea barberos en la pestaña Barberos.
        </p>
      </div>
    );
  }

  const today = todayKey();
  const view = sp.v === "week" ? "week" : "day";
  const date = isKey(sp.d) ? sp.d : today;

  const chosen = barbers.find((b) => b.id === sp.b) ?? null;
  // En la vista de semana siempre hay un barbero seleccionado
  const focus = view === "week" ? (chosen ?? barbers[0]) : chosen;
  const shown = focus ? [focus] : barbers;
  const extra = focus ? `&b=${focus.id}` : "";

  const keys = view === "week" ? weekKeys(date) : [date];
  const rangeStart = dayBounds(keys[0]).start;
  const rangeEnd = dayBounds(keys[keys.length - 1]).end;
    const nowMs = currentTimeMs();
  const nowIso = new Date(nowMs).toISOString();
  const ids = shown.map((b) => b.id);

  const [apptsRes, blocksRes, hoursRes, settingsRes, pendingRes] =
    await Promise.all([
      supabase
        .from("appointments")
        .select(
          "id,barber_id,customer_name,customer_phone,starts_at,ends_at,status,notes,cancel_reason,total_price,appointment_services(service_name,minutes,price)"
        )
        .in("barber_id", ids)
        .lt("starts_at", rangeEnd.toISOString())
        .gt("ends_at", rangeStart.toISOString())
        .order("starts_at"),
      supabase
        .from("time_blocks")
        .select("id,barber_id,reason,starts_at,ends_at")
        .in("barber_id", ids)
        .lt("starts_at", rangeEnd.toISOString())
        .gt("ends_at", rangeStart.toISOString()),
      supabase
        .from("barber_hours")
        .select("barber_id,weekday,start_time,end_time")
        .in("barber_id", ids),
      supabase.from("business_settings").select("name").eq("id", 1).maybeSingle(),
      supabase
        .from("appointments")
        .select("id,barber_id,customer_name,starts_at")
        .eq("status", "pending")
        .gte("ends_at", nowIso)
        .order("starts_at")
        .limit(8),
    ]);

  const appts = (apptsRes.data ?? []) as unknown as AdminAppt[];
  const blocks = (blocksRes.data ?? []) as AdminBlock[];
  const hours = (hoursRes.data ?? []) as AdminHour[];
  const biz = (settingsRes.data?.name as string | null) ?? "la barbería";
  const pending = pendingRes.data ?? [];
  const nameOf = (id: string) =>
    barbers.find((b) => b.id === id)?.name ?? "Barbero";

  const forBarber = (b: { id: string; name: string }, key: string) => ({
    dayKey: key,
    today,
    nowMs,
    hours: hours.filter((h) => h.barber_id === b.id),
    appts: appts.filter((a) => a.barber_id === b.id),
    blocks: blocks.filter((x) => x.barber_id === b.id),
    biz,
    barberName: b.name,
    showBarber: true,
  });

  const columns =
    view === "day"
      ? shown.map((b) =>
          buildColumn({ id: b.id, title: b.name, ...forBarber(b, date) })
        )
      : keys.map((key) =>
          buildColumn({
            id: key,
            title: dayShort(key),
            href: `/admin/citas?d=${key}&v=day&b=${shown[0].id}`,
            ...forBarber(shown[0], key),
          })
        );

  const title =
    view === "week"
      ? `${shown[0].name} · ${dayShort(keys[0])} – ${dayShort(keys[6])}`
      : dayLong(date);

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm transition ${
      active
        ? "border-accent bg-accent text-accent-fg"
        : "border-line bg-surface hover:border-fg"
    }`;
  const chipHref = (b?: string) =>
    `/admin/citas?d=${date}&v=${view}${b ? `&b=${b}` : ""}`;

  return (
    <div className="space-y-8">
      {header}

      {pending.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-amber-500/40 bg-surface p-5">
          <p className="font-medium">
            {pending.length === 8 ? "8 o más" : pending.length}{" "}
            {pending.length === 1 ? "cita" : "citas"} por aceptar
          </p>
          <div className="flex flex-wrap gap-2">
            {pending.map((p) => (
              <Link
                key={p.id}
                href={`/admin/citas?d=${dateValue(p.starts_at)}&v=day`}
                className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-fg"
              >
                {dayShort(dateValue(p.starts_at))} · {timeLabel(p.starts_at)} ·{" "}
                {p.customer_name} · {nameOf(p.barber_id as string)}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {view === "day" && (
          <Link href={chipHref()} className={chip(!focus)}>
            Todos
          </Link>
        )}
        {barbers.map((b) => (
          <Link
            key={b.id}
            href={chipHref(b.id)}
            className={chip(focus?.id === b.id)}
          >
            {b.name}
          </Link>
        ))}
      </div>

      <AgendaControls
        basePath="/admin/citas"
        date={date}
        view={view}
        today={today}
        extra={extra}
      />

      <h2 className="font-display text-2xl first-letter:uppercase">{title}</h2>

      <AgendaGrid columns={columns} today={today} />
    </div>
  );
}