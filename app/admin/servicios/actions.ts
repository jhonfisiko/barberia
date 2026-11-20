"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { isOwnMediaUrl } from "@/lib/barber";
import { createClient } from "@/lib/supabase/server";

export type ServiceState = {
  error?: string;
  ok?: boolean;
  stamp?: number;
  values?: {
    name: string;
    description: string;
    minutes: string;
    price: string;
    popular: boolean;
    image_url: string;
  };
};

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin/servicios");
}

export async function saveService(
  _prev: ServiceState,
  formData: FormData
): Promise<ServiceState> {
  await requireRole("owner");

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const values = {
    name,
    description,
    minutes: String(formData.get("minutes") ?? ""),
    price: String(formData.get("price") ?? ""),
    popular: formData.get("popular") === "on",
    image_url: String(formData.get("image_url") ?? "").trim(),
  };
  const minutes = Number(values.minutes);
  const price = Number(values.price);

  if (!name) return { error: "Escribe el nombre del servicio.", values };
  if (!Number.isInteger(minutes) || minutes <= 0)
    return {
      error: "La duración debe ser un número de minutos mayor que 0.",
      values,
    };
  if (!Number.isInteger(price) || price < 0)
    return { error: "El precio debe ser un número entero.", values };
  if (values.image_url && !isOwnMediaUrl(values.image_url))
    return { error: "La imagen no es válida. Súbela de nuevo.", values };

  const supabase = await createClient();
  const payload = {
    name,
    description: description || null,
    minutes,
    price,
    popular: values.popular,
    image_url: values.image_url || null,
  };

  if (id) {
    const { error } = await supabase
      .from("services")
      .update(payload)
      .eq("id", id);
    if (error)
      return { error: "No se pudo guardar: " + error.message, values };
  } else {
    const { data: last } = await supabase
      .from("services")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: created, error } = await supabase
      .from("services")
      .insert({ ...payload, sort_order: (last?.sort_order ?? 0) + 1 })
      .select("id")
      .single();
    if (error || !created)
      return { error: "No se pudo crear: " + (error?.message ?? ""), values };

    // Por defecto, todos los barberos hacen el servicio nuevo
    const { data: team } = await supabase.from("barbers").select("id");
    if (team && team.length > 0) {
      await supabase
        .from("barber_services")
        .insert(team.map((b) => ({ barber_id: b.id, service_id: created.id })));
    }
  }

  refresh();
  return { ok: true, stamp: Date.now() };
}

export async function toggleService(formData: FormData): Promise<void> {
  await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("services").update({ active }).eq("id", id);
  refresh();
}

export async function deleteService(formData: FormData): Promise<void> {
  await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("services").delete().eq("id", id);
  refresh();
}