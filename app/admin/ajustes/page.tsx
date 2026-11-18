import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_settings")
    .select(
      "name,whatsapp,address,hours_text,open_time,close_time,slot_minutes,closed_days"
    )
    .eq("id", 1)
    .maybeSingle();

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Negocio</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Ajustes</h1>
        <p className="mt-2 text-sm text-muted">
          Tu contacto y las reglas generales de las reservas. Lo que cambies
          aquí se actualiza en la página pública.
        </p>
      </div>

      <SettingsForm
        initial={{
          name: data?.name ?? "",
          whatsapp: data?.whatsapp ?? "",
          address: data?.address ?? "",
          hours_text: data?.hours_text ?? "",
          slot_minutes: data?.slot_minutes ?? 30,
          open_time: (data?.open_time ?? "09:00").slice(0, 5),
          close_time: (data?.close_time ?? "19:00").slice(0, 5),
          closed_days: data?.closed_days ?? [0],
        }}
      />
    </div>
  );
}