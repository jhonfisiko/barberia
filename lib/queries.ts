import { createClient } from "@/lib/supabase/server";
import type { Barber, Service, Settings, Work } from "@/lib/types";

const DEFAULT_SETTINGS: Settings = {
  name: "wearco Barber Estudio",
  whatsapp: "",
  address: "",
  hours_text: "",
  open_time: "09:00",
  close_time: "19:00",
  slot_minutes: 30,
  closed_days: [0],
};

export async function getSiteData() {
  const supabase = await createClient();

  const [barbers, services, works, settings] = await Promise.all([
    supabase
      .from("barbers")
      .select("id,name,role_title,bio,specialties,photo_url")
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("services")
      .select("id,name,description,minutes,price,popular")
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("works")
      .select("id,barber_id,title,image_url")
      .order("created_at", { ascending: false }),
    supabase
      .from("business_settings")
      .select(
        "name,whatsapp,address,hours_text,open_time,close_time,slot_minutes,closed_days"
      )
      .eq("id", 1)
      .maybeSingle(),
  ]);

  for (const r of [barbers, services, works, settings]) {
    if (r.error) console.error("Supabase:", r.error.message);
  }

  return {
    barbers: (barbers.data ?? []) as Barber[],
    services: (services.data ?? []) as Service[],
    works: (works.data ?? []) as Work[],
    settings: { ...DEFAULT_SETTINGS, ...(settings.data ?? {}) } as Settings,
  };
}