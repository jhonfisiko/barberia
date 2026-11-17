import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

export default async function PanelHome() {
  const session = await getSessionProfile();
  const supabase = await createClient();

  const { data: barber } = await supabase
    .from("barbers")
    .select("id, name, role_title")
    .eq("user_id", session!.user.id)
    .maybeSingle();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Inicio</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          Hola, {barber?.name ?? session?.name}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Aquí verás tu agenda, tus citas y podrás bloquear tus descansos.
        </p>
      </div>

      {!barber && (
        <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
          Tu cuenta aún no está vinculada a un barbero. Pídele al administrador
          que la conecte.
        </div>
      )}
    </div>
  );
}