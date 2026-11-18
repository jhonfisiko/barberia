import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDays, todayKey, weekdayOf } from "@/lib/agenda";
import type { AvailabilityResult, Slot } from "@/lib/availability-types";

export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_SERVICES = 6;
const MIN_MS = 60_000;
const DAY_MS = 24 * 60 * MIN_MS;

export function parseServiceIds(raw: string | null): string[] | null {
  if (!raw) return null;
  const ids = Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
  if (ids.length === 0 || ids.length > MAX_SERVICES) return null;
  return ids.every((id) => UUID.test(id)) ? ids : null;
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const hhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// Colombia no tiene cambio de horario: siempre UTC-5
const at = (key: string, min: number) =>
  new Date(`${key}T${hhmm(min)}:00-05:00`).getTime();

export async function computeAvailability(
  serviceIds: string[],
  barberParam: string
): Promise<AvailabilityResult> {
  const admin = createAdminClient();

  const [settingsRes, servicesRes, barbersRes, linksRes] = await Promise.all([
    admin
      .from("business_settings")
      .select("slot_minutes,min_notice_hours,max_days_ahead,closed_days")
      .eq("id", 1)
      .maybeSingle(),
    admin
      .from("services")
      .select("id,minutes")
      .in("id", serviceIds)
      .eq("active", true),
    admin.from("barbers").select("id").eq("active", true),
    admin.from("barber_services").select("barber_id,service_id,minutes"),
  ]);

  const services = servicesRes.data ?? [];
  if (services.length !== serviceIds.length)
    return { days: {}, error: "Alguno de los servicios ya no está disponible." };

  const settings = settingsRes.data;
  const slot = Math.max(5, Number(settings?.slot_minutes ?? 30));
  const notice = Number(settings?.min_notice_hours ?? 2);
  const ahead = Math.min(60, Math.max(1, Number(settings?.max_days_ahead ?? 21)));
  const closed = (settings?.closed_days ?? [0]) as number[];

  // ---- Barberos que hacen TODOS los servicios elegidos ----
  const links = linksRes.data ?? [];
  const noLinks = links.length === 0; // sin asignaciones: todos hacen todo

  const durationFor = (barberId: string) => {
    let total = 0;
    for (const s of services) {
      const link = links.find(
        (l) => l.barber_id === barberId && l.service_id === s.id
      );
      if (!link && !noLinks) return null;
      total += (link?.minutes as number | null) ?? (s.minutes as number);
    }
    return total;
  };

  let candidates = (barbersRes.data ?? []).map((b) => b.id as string);
  if (barberParam !== "any")
    candidates = candidates.filter((id) => id === barberParam);

  const eligible = candidates
    .map((id) => ({ id, minutes: durationFor(id) }))
    .filter((b): b is { id: string; minutes: number } => b.minutes !== null);

  if (eligible.length === 0) return { days: {} };

  // ---- Ventana de días ----
  const today = todayKey();
  const keys = Array.from({ length: ahead }, (_, i) => addDays(today, i));
  const windowStart = at(keys[0], 0);
  const windowEnd = at(keys[keys.length - 1], 0) + DAY_MS;
  const startIso = new Date(windowStart).toISOString();
  const endIso = new Date(windowEnd).toISOString();
  const ids = eligible.map((b) => b.id);

  const [hoursRes, blocksRes, apptsRes] = await Promise.all([
    admin
      .from("barber_hours")
      .select("barber_id,weekday,start_time,end_time")
      .in("barber_id", ids),
    admin
      .from("time_blocks")
      .select("barber_id,starts_at,ends_at")
      .in("barber_id", ids)
      .lt("starts_at", endIso)
      .gt("ends_at", startIso),
    admin
      .from("appointments")
      .select("barber_id,starts_at,ends_at")
      .in("barber_id", ids)
      .in("status", ["pending", "confirmed"])
      .lt("starts_at", endIso)
      .gt("ends_at", startIso),
  ]);

  const hours = hoursRes.data ?? [];

  // Intervalos ocupados por barbero: bloqueos + citas
  const busy = new Map<string, [number, number][]>();
  for (const row of [...(blocksRes.data ?? []), ...(apptsRes.data ?? [])]) {
    const list = busy.get(row.barber_id as string) ?? [];
    list.push([
      new Date(row.starts_at as string).getTime(),
      new Date(row.ends_at as string).getTime(),
    ]);
    busy.set(row.barber_id as string, list);
  }

  const earliest = Date.now() + notice * 60 * MIN_MS;
  const days: Record<string, Slot[]> = {};

  for (const key of keys) {
    const wd = weekdayOf(key);
    if (closed.includes(wd)) continue;

    const byStart = new Map<number, string[]>();

    for (const b of eligible) {
      const taken = busy.get(b.id) ?? [];
      const tramos = hours.filter(
        (h) => h.barber_id === b.id && h.weekday === wd
      );

      for (const tr of tramos) {
        const from = toMin(tr.start_time as string);
        const to = toMin(tr.end_time as string);

        for (let m = from; m + b.minutes <= to; m += slot) {
          const s = at(key, m);
          const e = s + b.minutes * MIN_MS;
          if (s < earliest) continue;
          if (taken.some(([bs, be]) => s < be && e > bs)) continue;

          const list = byStart.get(m);
          if (list) list.push(b.id);
          else byStart.set(m, [b.id]);
        }
      }
    }

    const slots = Array.from(byStart.entries())
      .sort((x, y) => x[0] - y[0])
      .map(([m, barbers]) => ({ t: hhmm(m), b: barbers }));

    if (slots.length > 0) days[key] = slots;
  }

  return { days };
}