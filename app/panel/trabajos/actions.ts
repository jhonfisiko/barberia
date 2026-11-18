"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { isOwnMediaUrl, mediaPathFromUrl } from "@/lib/barber";
import { createClient } from "@/lib/supabase/server";

export type WorkState = { error?: string; ok?: boolean; stamp?: number };

const MAX_WORKS = 24;

export async function addWork(
  _prev: WorkState,
  formData: FormData
): Promise<WorkState> {
  const session = await requireRole("barber");

  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim().slice(0, 60);

  if (!imageUrl) return { error: "Sube una foto primero." };
  if (!isOwnMediaUrl(imageUrl))
    return { error: "La foto no es válida. Súbela de nuevo." };

  const supabase = await createClient();
  const { data: barber } = await supabase
    .from("barbers")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!barber) return { error: "Tu cuenta no está vinculada a un barbero." };

  const { count } = await supabase
    .from("works")
    .select("*", { count: "exact", head: true })
    .eq("barber_id", barber.id);
  if ((count ?? 0) >= MAX_WORKS)
    return {
      error: `Llegaste al máximo de ${MAX_WORKS} trabajos. Elimina alguno para subir otro.`,
    };

  const { error } = await supabase.from("works").insert({
    barber_id: barber.id,
    title: title || null,
    image_url: imageUrl,
  });
  if (error) return { error: "No se pudo guardar: " + error.message };

  revalidatePath("/");
  revalidatePath("/panel/trabajos");
  return { ok: true, stamp: Date.now() };
}

export async function deleteWork(formData: FormData): Promise<void> {
  await requireRole("barber");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  // Solo ve y borra los suyos: lo garantiza la seguridad de la base de datos
  const { data: work } = await supabase
    .from("works")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();
  if (!work) return;

  const { error } = await supabase.from("works").delete().eq("id", id);
  if (error) return;

  // Se limpia también el archivo del almacenamiento
  const path = mediaPathFromUrl(work.image_url);
  if (path) await supabase.storage.from("media").remove([path]);

  revalidatePath("/");
  revalidatePath("/panel/trabajos");
}