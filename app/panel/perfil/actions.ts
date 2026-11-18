"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { isOwnMediaUrl } from "@/lib/barber";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = {
  error?: string;
  ok?: boolean;
  stamp?: number;
  values?: { bio: string; specialties: string; photo_url: string };
};

export async function saveOwnProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const session = await requireRole("barber");

  const values = {
    bio: String(formData.get("bio") ?? "").trim(),
    specialties: String(formData.get("specialties") ?? "").trim(),
    photo_url: String(formData.get("photo_url") ?? "").trim(),
  };

  const specialties = values.specialties
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (specialties.length > 8)
    return { error: "Máximo 8 especialidades.", values };
  if (values.bio.length > 400)
    return {
      error: "La descripción es muy larga (máximo 400 caracteres).",
      values,
    };
  if (values.photo_url && !isOwnMediaUrl(values.photo_url))
    return { error: "La foto no es válida. Súbela de nuevo.", values };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("barbers")
    .update({
      bio: values.bio || null,
      specialties,
      photo_url: values.photo_url || null,
    })
    .eq("user_id", session.user.id)
    .select("id");

  if (error) return { error: "No se pudo guardar: " + error.message, values };
  if (!data || data.length === 0)
    return {
      error:
        "No se pudo guardar. Si el problema sigue, avisa al administrador.",
      values,
    };

  revalidatePath("/");
  revalidatePath("/panel/perfil");
  return { ok: true, stamp: Date.now() };
}