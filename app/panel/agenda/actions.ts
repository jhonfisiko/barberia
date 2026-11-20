"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AgendaState = { error?: string; ok?: boolean };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function refresh() {
  revalidatePath("/panel/agenda");
  revalidatePath("/admin/citas");
}

export async function acceptAppointment(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("appointments")
    .update({ status: "confirmed" })
    .eq("id", id)
    .eq("status", "pending");
  refresh();
}

export async function completeAppointment(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("appointments")
    .update({ status: "done" })
    .eq("id", id)
    .eq("status", "confirmed");
  refresh();
}

export async function cancelAppointment(
  _prev: AgendaState,
  formData: FormData
): Promise<AgendaState> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 200);

  if (!id) return { error: "Falta la cita." };
  if (reason.length < 3)
    return { error: "Escribe el motivo para poder avisarle al cliente." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled", cancel_reason: reason })
    .eq("id", id)
    .in("status", ["pending", "confirmed"])
    .select("id");

  if (error) return { error: "No se pudo cancelar: " + error.message };
  if (!data || data.length === 0)
    return { error: "Esta cita ya no se puede cancelar." };

  refresh();
  return { ok: true };
}

export async function rescheduleAppointment(
  _prev: AgendaState,
  formData: FormData
): Promise<AgendaState> {
  const session = await requireStaff();

  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");

  if (!id) return { error: "Falta la cita." };
  if (!DATE.test(date) || !TIME.test(time))
    return { error: "Elige la nueva fecha y hora." };

  const supabase = await createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("barber_id,starts_at,ends_at,status")
    .eq("id", id)
    .maybeSingle();

  if (!appt || !["pending", "confirmed"].includes(appt.status))
    return { error: "Esta cita ya no se puede aplazar." };

  const duration =
    new Date(appt.ends_at).getTime() - new Date(appt.starts_at).getTime();
  const start = new Date(`${date}T${time}:00-05:00`);
  if (Number.isNaN(start.getTime())) return { error: "La fecha no es válida." };
  const end = new Date(start.getTime() + duration);

  if (start.getTime() <= Date.now())
    return { error: "Elige una fecha y hora futuras." };

  // No puede caer en un descanso o bloqueo del barbero
  const { count } = await supabase
    .from("time_blocks")
    .select("*", { count: "exact", head: true })
    .eq("barber_id", appt.barber_id)
    .lt("starts_at", end.toISOString())
    .gt("ends_at", start.toISOString());
  if ((count ?? 0) > 0)
    return { error: "Ese horario coincide con un bloqueo del barbero." };

  const { error } = await supabase
    .from("appointments")
    .update({ starts_at: start.toISOString(), ends_at: end.toISOString() })
    .eq("id", id);

  if (error) {
    // 23P01: la base de datos impide que dos citas se crucen
    if (error.code === "23P01")
      return { error: "Ya hay otra cita en ese horario." };
    return { error: "No se pudo aplazar: " + error.message };
  }

  refresh();
  redirect(
    session.role === "owner"
      ? `/admin/citas?d=${date}&v=day`
      : `/panel/agenda?d=${date}&v=day`
  );
}