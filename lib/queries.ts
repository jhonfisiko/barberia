import { createClient } from "@/lib/supabase/server";
import type {
  Barber,
  BarberService,
  Service,
  Settings,
  Work,
} from "@/lib/types";

const DEFAULT_SETTINGS: Settings = {
  name: " Barber Estudio",
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

  const [barbers, services, works, settings, links] = await Promise.all([
    supabase
      .from("barbers")
      .select("id,name,role_title,bio,specialties,photo_url")
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("services")
      .select("id,name,description,minutes,price,popular,image_url")
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
    supabase
      .from("barber_services")
      .select("barber_id,service_id,minutes,price"),
  ]);

  for (const r of [barbers, services, works, settings, links]) {
    if (r.error) console.error("Supabase:", r.error.message);
  }

  return {
    barbers: (barbers.data ?? []) as Barber[],
    services: (services.data ?? []) as Service[],
    works: (works.data ?? []) as Work[],
    barberServices: (links.data ?? []) as BarberService[],
    settings: { ...DEFAULT_SETTINGS, ...(settings.data ?? {}) } as Settings,
  };
}