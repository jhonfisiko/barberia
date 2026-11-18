"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { getOwnBarber } from "@/lib/barber";
import { createClient } from "@/lib/supabase/server";

export type BlockState = { error?: string; ok?: boolean };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const REASONS = [
  "Almuerzo",
  "Descanso",
  "Cita médica",
  "Permiso",
  "Vacaciones",
  "Otro",
];
const DAY_MS = 24 * 60 * 60 * 1000;

// Colombia no tiene cambio de horario: siempre UTC-5
const at = (date: string, time: string) =>
  new Date(`${date}T${time}:00-05:00`);

export async function addBlock(
  _prev: BlockState,
  formData: FormData
): Promise<BlockState> {
  const { barber } = await getOwnBarber();
  if (!barber) return { error: "Tu cuenta no está vinculada a un barbero." };

  const kind = String(formData.get("kind") ?? "hours");
  const type = String(formData.get("reason_type") ?? "");
  const note = String(formData.get("reason_note") ?? "").trim().slice(0, 80);

  if (!REASONS.includes(type)) return { error: "Elige un motivo." };
  const reason =
    type === "Otro" ? note || "Otro" : note ? `${type}: ${note}` : type;

  let start: Date;
  let end: Date;

  if (kind === "days") {
    const from = String(formData.get("date_from") ?? "");
    const to = String(formData.get("date_to") ?? "");
    if (!DATE.test(from) || !DATE.test(to))
      return { error: "Elige las fechas." };
    start = at(from, "00:00");
    const last = at(to, "00:00");
    if (Number.isNaN(start.getTime()) || Number.isNaN(last.getTime()))
      return { error: "Las fechas no son válidas." };
    if (last < start)
      return { error: "La fecha final debe ser igual o posterior a la inicial." };
    end = new Date(last.getTime() + DAY_MS);
  } else {
    const date = String(formData.get("date") ?? "");
    const from = String(formData.get("from") ?? "");
    const to = String(formData.get("to") ?? "");
    if (!DATE.test(date) || !TIME.test(from) || !TIME.test(to))
      return { error: "Completa el día y las horas." };
    start = at(date, from);
    end = at(date, to);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
      return { error: "La fecha o la hora no son válidas." };
    if (end <= start)
      return { error: "La hora final debe ser después de la inicial." };
  }

  if (end.getTime() <= Date.now()) return { error: "Esa fecha ya pasó." };
  if (end.getTime() - start.getTime() > 366 * DAY_MS)
    return { error: "El bloqueo no puede durar más de un año." };

  const supabase = await createClient();

  // No se puede bloquear encima de citas ya agendadas
  const { count } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("barber_id", barber.id)
    .in("status", ["pending", "confirmed"])
    .lt("starts_at", end.toISOString())
    .gt("ends_at", start.toISOString());

  if ((count ?? 0) > 0)
    return {
      error: `Tienes ${count} cita(s) en ese horario. Cancélalas o aplázalas primero.`,
    };

  const { error } = await supabase.from("time_blocks").insert({
    barber_id: barber.id,
    reason,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
  });
  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath("/panel/bloqueos");
  return { ok: true };
}

export async function deleteBlock(formData: FormData): Promise<void> {
  await requireRole("barber");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // La seguridad de la base de datos garantiza que solo borre los suyos
  const supabase = await createClient();
  await supabase.from("time_blocks").delete().eq("id", id);

  revalidatePath("/panel/bloqueos");
}