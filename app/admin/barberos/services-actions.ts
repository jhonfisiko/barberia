"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SimpleState } from "@/app/admin/barberos/actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function saveBarberServices(
  _prev: SimpleState,
  formData: FormData
): Promise<SimpleState> {
  await requireRole("owner");

  const barberId = String(formData.get("barber_id") ?? "");
  if (!UUID.test(barberId)) return { error: "Falta el barbero." };

  const selected = formData
    .getAll("svc")
    .map(String)
    .filter((id) => UUID.test(id));

  const rows: {
    barber_id: string;
    service_id: string;
    minutes: number | null;
    price: number | null;
  }[] = [];

  for (const sid of selected) {
    const m = String(formData.get(`minutes_${sid}`) ?? "").trim();
    const p = String(formData.get(`price_${sid}`) ?? "").trim();
    const minutes = m === "" ? null : Number(m);
    const price = p === "" ? null : Number(p);

    if (minutes !== null && (!Number.isInteger(minutes) || minutes <= 0))
      return { error: "Revisa los tiempos: deben ser minutos mayores que 0." };
    if (price !== null && (!Number.isInteger(price) || price < 0))
      return { error: "Revisa los precios: deben ser números enteros." };

    rows.push({ barber_id: barberId, service_id: sid, minutes, price });
  }

  const supabase = await createClient();

  if (rows.length > 0) {
    const { error } = await supabase
      .from("barber_services")
      .upsert(rows, { onConflict: "barber_id,service_id" });
    if (error) return { error: "No se pudo guardar: " + error.message };
  }

  let del = supabase.from("barber_services").delete().eq("barber_id", barberId);
  if (selected.length > 0) {
    del = del.not("service_id", "in", `(${selected.join(",")})`);
  }
  const { error: delError } = await del;
  if (delError) return { error: "No se pudo guardar: " + delError.message };

  revalidatePath("/");
  revalidatePath("/admin/barberos");
  return { ok: true };
}