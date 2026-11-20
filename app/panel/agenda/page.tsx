import Link from "next/link";
import { connection } from "next/server";
import { AgendaControls } from "@/components/agenda-controls";
import { AgendaGrid } from "@/components/agenda-grid";
import { buildColumn } from "@/lib/agenda-grid";
import { getOwnBarber } from "@/lib/barber";
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

const href = (d: string, v: string) => `/panel/agenda?d=${d}&v=${v}`;

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
        Toca una cita para aceptarla, aplazarla o cancelarla. Las zonas verdes
        son tus huecos libres.
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
    const nowMs = currentTimeMs();
  const nowIso = new Date(nowMs).toISOString();

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

  const columns = keys.map((key) =>
    buildColumn({
      id: key,
      title: view === "week" ? dayShort(key) : barber.name,
      href: view === "week" ? href(key, "day") : undefined,
      dayKey: key,
      today,
      nowMs,
      hours,
      appts,
      blocks,
      biz,
      barberName: barber.name,
    })
  );

  const title =
    view === "week"
      ? `${dayShort(keys[0])} – ${dayShort(keys[6])}`
      : dayLong(date);

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

      <AgendaControls
        basePath="/panel/agenda"
        date={date}
        view={view}
        today={today}
      />

      <h2 className="font-display text-2xl first-letter:uppercase">{title}</h2>

      <AgendaGrid columns={columns} today={today} />
    </div>
  );
}