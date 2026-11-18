"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SimpleState } from "@/app/admin/barberos/actions";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const SLOTS = [15, 20, 30, 45, 60];

export async function saveSettings(
  _prev: SimpleState,
  formData: FormData
): Promise<SimpleState> {
  await requireRole("owner");

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const hoursText = String(formData.get("hours_text") ?? "").trim();
  let whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "");
  const slot = Number(formData.get("slot_minutes"));
  const open = String(formData.get("open_time") ?? "");
  const close = String(formData.get("close_time") ?? "");
  const closed = Array.from(
    new Set(
      formData
        .getAll("closed")
        .map(Number)
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
    )
  ).sort();

  if (!name) return { error: "Escribe el nombre del negocio." };

  // Celular colombiano de 10 dígitos: se le agrega el código de país
  if (/^3\d{9}$/.test(whatsapp)) whatsapp = "57" + whatsapp;
  if (whatsapp && (whatsapp.length < 11 || whatsapp.length > 15))
    return {
      error:
        "El WhatsApp debe incluir el código de país, por ejemplo 573001234567.",
    };

  if (!SLOTS.includes(slot))
    return { error: "Elige un intervalo de citas válido." };
  if (!TIME.test(open) || !TIME.test(close))
    return { error: "Revisa las horas de apertura y cierre." };
  if (close <= open)
    return { error: "La hora de cierre debe ser después de la de apertura." };
  if (closed.length >= 7)
    return { error: "No puedes marcar todos los días como cerrados." };

  const supabase = await createClient();
  const { error } = await supabase.from("business_settings").upsert(
    {
      id: 1,
      name,
      whatsapp: whatsapp || null,
      address: address || null,
      hours_text: hoursText || null,
      slot_minutes: slot,
      open_time: open,
      close_time: close,
      closed_days: closed,
    },
    { onConflict: "id" }
  );
  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath("/");
  revalidatePath("/admin/ajustes");
  return { ok: true };
}