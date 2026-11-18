"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { UUID, computeAvailability, parseServiceIds } from "@/lib/availability";
import { normalizePhone, quoteFor } from "@/lib/booking";

export type BookingSummary = {
  name: string;
  phone: string;
  barberName: string;
  day: string;
  time: string;
  minutes: number;
  price: number;
  services: string[];
};

export type BookingState = {
  ok?: boolean;
  error?: string;
  refresh?: boolean;
  stamp?: number;
  summary?: BookingSummary;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const LINK = /https?:|www\./i;
const HOUR_MS = 3_600_000;

const MAX_ACTIVE_PER_PHONE = 2;
const MAX_PER_PHONE_PER_HOUR = 3;
const MAX_PER_IP_PER_HOUR = 6;
const MAX_GLOBAL_PER_10_MIN = 40;

const fail = (error: string, refresh = false): BookingState =>
  refresh ? { error, refresh: true, stamp: Date.now() } : { error };

export async function createAppointment(
  _prev: BookingState,
  formData: FormData
): Promise<BookingState> {
  // ---- 1. Protección contra bots ----
  // Campo trampa: las personas no lo ven, los bots sí lo llenan
  if (String(formData.get("website") ?? "").trim() !== "")
    return fail("No se pudo enviar la solicitud. Intenta de nuevo.");

  // Un humano no llena el formulario en menos de 2.5 segundos
  const delta = Date.now() - Number(formData.get("opened"));
  if (delta >= 0 && delta < 2500)
    return fail("Un momento… revisa tus datos y vuelve a intentarlo.");

  // ---- 2. Datos ----
  const serviceIds = parseServiceIds(String(formData.get("services") ?? ""));
  const barberParam = String(formData.get("barber") ?? "");
  const day = String(formData.get("day") ?? "");
  const time = String(formData.get("time") ?? "");
  const name = String(formData.get("name") ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 200);

  if (
    !serviceIds ||
    (barberParam !== "any" && !UUID.test(barberParam)) ||
    !DAY.test(day) ||
    !TIME.test(time)
  )
    return fail(
      "La selección no es válida. Recarga la página e inténtalo de nuevo."
    );
  if (
    name.length < 2 ||
    name.length > 60 ||
    !/\p{L}/u.test(name) ||
    LINK.test(name)
  )
    return fail("Escribe tu nombre.");
  if (!phone)
    return fail("Escribe un celular válido de 10 dígitos (empieza por 3).");
  if (LINK.test(notes)) return fail("La nota no puede incluir enlaces.");

  // ---- 3. Límites por celular, por conexión y generales ----
  const admin = createAdminClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const hourAgo = new Date(now - HOUR_MS).toISOString();
  const tenMinAgo = new Date(now - 600_000).toISOString();

  const h = await headers();
  const ip =
    (h.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "";
  const ipHash = ip
    ? createHash("sha256").update(`${ip}:woeaco`).digest("hex").slice(0, 32)
    : null;

  const [active, recentPhone, recentIp, flood] = await Promise.all([
    admin
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("customer_phone", phone)
      .in("status", ["pending", "confirmed"])
      .gte("ends_at", nowIso),
    admin
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("customer_phone", phone)
      .gte("created_at", hourAgo),
    ipHash
      ? admin
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("ip_hash", ipHash)
          .gte("created_at", hourAgo)
      : Promise.resolve({ count: 0 }),
    admin
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", tenMinAgo),
  ]);

  if ((active.count ?? 0) >= MAX_ACTIVE_PER_PHONE)
    return fail(
      `Ya tienes ${MAX_ACTIVE_PER_PHONE} citas activas con este número. Espera a que se atiendan o escríbenos por WhatsApp.`
    );
  if (
    (recentPhone.count ?? 0) >= MAX_PER_PHONE_PER_HOUR ||
    (recentIp.count ?? 0) >= MAX_PER_IP_PER_HOUR
  )
    return fail("Hiciste varias solicitudes seguidas. Intenta de nuevo más tarde.");
  if ((flood.count ?? 0) >= MAX_GLOBAL_PER_10_MIN)
    return fail("Hay muchas solicitudes en este momento. Intenta en unos minutos.");

  // ---- 4. La hora sigue libre? (se recalcula en el servidor) ----
  const availability = await computeAvailability(serviceIds, barberParam);
  const slot = availability.days[day]?.find((s) => s.t === time);
  if (!slot) return fail("Esa hora ya no está disponible. Elige otra.", true);

  // ---- 5. Barbero: con "cualquiera", el que tenga menos citas ese día ----
  let ordered = slot.b;
  if (barberParam === "any" && slot.b.length > 1) {
    const dayStart = new Date(`${day}T00:00:00-05:00`);
    const dayEnd = new Date(dayStart.getTime() + 24 * HOUR_MS);
    const { data: load } = await admin
      .from("appointments")
      .select("barber_id")
      .in("barber_id", slot.b)
      .in("status", ["pending", "confirmed"])
      .gte("starts_at", dayStart.toISOString())
      .lt("starts_at", dayEnd.toISOString());

    const counts = new Map<string, number>(slot.b.map((id) => [id, 0]));
    for (const row of load ?? [])
      counts.set(
        row.barber_id as string,
        (counts.get(row.barber_id as string) ?? 0) + 1
      );
    ordered = [...slot.b].sort(
      (a, b) => (counts.get(a) ?? 0) - (counts.get(b) ?? 0)
    );
  }

  // ---- 6. Guardar la cita ----
  const start = new Date(`${day}T${time}:00-05:00`);

  for (const barberId of ordered) {
    const quote = await quoteFor(serviceIds, barberId);
    if (!quote) return fail("Alguno de los servicios ya no está disponible.");

    const end = new Date(start.getTime() + quote.minutes * 60_000);

    const { data: created, error } = await admin
      .from("appointments")
      .insert({
        barber_id: barberId,
        service_id: serviceIds[0],
        customer_name: name,
        customer_phone: phone,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        status: "pending",
        total_price: quote.price,
        notes: notes || null,
        ip_hash: ipHash,
      })
      .select("id")
      .single();

    if (error) {
      // 23P01: otra persona tomó esa hora al mismo tiempo; se prueba con el siguiente barbero
      if (error.code === "23P01") continue;
      console.error("Reserva:", error.message);
      return fail("No se pudo guardar tu cita. Intenta de nuevo.");
    }

    const { error: linesError } = await admin
      .from("appointment_services")
      .insert(
        quote.lines.map((l) => ({
          appointment_id: created.id,
          service_id: l.service_id,
          service_name: l.name,
          minutes: l.minutes,
          price: l.price,
        }))
      );

    if (linesError) {
      await admin.from("appointments").delete().eq("id", created.id);
      console.error("Reserva (servicios):", linesError.message);
      return fail("No se pudo guardar tu cita. Intenta de nuevo.");
    }

    const { data: barber } = await admin
      .from("barbers")
      .select("name")
      .eq("id", barberId)
      .maybeSingle();

    return {
      ok: true,
      summary: {
        name,
        phone,
        barberName: (barber?.name as string | undefined) ?? "tu barbero",
        day,
        time,
        minutes: quote.minutes,
        price: quote.price,
        services: quote.lines.map((l) => l.name),
      },
    };
  }

  return fail("Esa hora se acaba de ocupar. Elige otra.", true);
}