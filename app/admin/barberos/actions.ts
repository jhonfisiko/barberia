"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type BarberState = {
  error?: string;
  ok?: boolean;
  stamp?: number;
  values?: {
    name: string;
    role_title: string;
    bio: string;
    specialties: string;
    photo_url: string;
  };
};

export type SimpleState = { error?: string; ok?: boolean };

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin/barberos");
}

export async function saveBarber(
  _prev: BarberState,
  formData: FormData
): Promise<BarberState> {
  await requireRole("owner");

  const id = String(formData.get("id") ?? "");
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    role_title: String(formData.get("role_title") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim(),
    specialties: String(formData.get("specialties") ?? "").trim(),
    photo_url: String(formData.get("photo_url") ?? "").trim(),
  };

  if (!values.name) return { error: "Escribe el nombre del barbero.", values };

  const payload = {
    name: values.name,
    role_title: values.role_title || "Barbero",
    bio: values.bio || null,
    specialties: values.specialties
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    photo_url: values.photo_url || null,
  };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("barbers")
      .update(payload)
      .eq("id", id);
    if (error)
      return { error: "No se pudo guardar: " + error.message, values };
  } else {
    const { data: last } = await supabase
      .from("barbers")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: created, error } = await supabase
      .from("barbers")
      .insert({ ...payload, sort_order: (last?.sort_order ?? 0) + 1 })
      .select("id")
      .single();
    if (error || !created)
      return { error: "No se pudo crear: " + (error?.message ?? ""), values };

    // Por defecto hace todos los servicios (se ajusta después)
    const { data: all } = await supabase.from("services").select("id");
    if (all && all.length > 0) {
      await supabase
        .from("barber_services")
        .insert(all.map((s) => ({ barber_id: created.id, service_id: s.id })));
    }
  }

  refresh();
  return { ok: true, stamp: Date.now() };
}

export async function toggleBarber(formData: FormData): Promise<void> {
  await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("barbers").update({ active }).eq("id", id);
  refresh();
}

export async function deleteBarber(formData: FormData): Promise<void> {
  await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data: barber } = await supabase
    .from("barbers")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("barbers").delete().eq("id", id);

  // También se elimina su cuenta de acceso
  if (barber?.user_id) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(barber.user_id);
  }
  refresh();
}

export async function createBarberAccount(
  _prev: SimpleState,
  formData: FormData
): Promise<SimpleState> {
  await requireRole("owner");

  const barberId = String(formData.get("barber_id") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!barberId) return { error: "Falta el barbero." };
  if (!email.includes("@")) return { error: "Escribe un correo válido." };
  if (password.length < 8)
    return { error: "La contraseña debe tener al menos 8 caracteres." };

  const admin = createAdminClient();

  const { data: barber } = await admin
    .from("barbers")
    .select("name, user_id")
    .eq("id", barberId)
    .maybeSingle();
  if (!barber) return { error: "No se encontró al barbero." };
  if (barber.user_id) return { error: "Este barbero ya tiene acceso." };

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: barber.name },
  });

  if (error || !data.user) {
    const taken = error?.message?.toLowerCase().includes("already");
    return {
      error: taken
        ? "Ese correo ya tiene una cuenta."
        : "No se pudo crear la cuenta: " + (error?.message ?? "error"),
    };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    role: "barber",
    full_name: barber.name,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "No se pudo asignar el rol: " + profileError.message };
  }

  const { error: linkError } = await admin
    .from("barbers")
    .update({ user_id: data.user.id })
    .eq("id", barberId);
  if (linkError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "No se pudo vincular la cuenta: " + linkError.message };
  }

  refresh();
  return { ok: true };
}

export async function resetBarberPassword(
  _prev: SimpleState,
  formData: FormData
): Promise<SimpleState> {
  await requireRole("owner");

  const barberId = String(formData.get("barber_id") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 8)
    return { error: "La contraseña debe tener al menos 8 caracteres." };

  const admin = createAdminClient();
  const { data: barber } = await admin
    .from("barbers")
    .select("user_id")
    .eq("id", barberId)
    .maybeSingle();
  if (!barber?.user_id) return { error: "Este barbero no tiene cuenta." };

  const { error } = await admin.auth.admin.updateUserById(barber.user_id, {
    password,
  });
  if (error) return { error: "No se pudo cambiar: " + error.message };

  return { ok: true };
}