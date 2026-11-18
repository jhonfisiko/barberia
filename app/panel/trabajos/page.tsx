import { WorksManager, type OwnWork } from "@/components/works-manager";
import { getOwnBarber } from "@/lib/barber";
import { createClient } from "@/lib/supabase/server";

export default async function WorksPage() {
  const { barber } = await getOwnBarber();

  let works: OwnWork[] = [];
  if (barber) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("works")
      .select("id,title,image_url")
      .eq("barber_id", barber.id)
      .order("created_at", { ascending: false });
    works = (data ?? []) as OwnWork[];
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">
          Portafolio
        </p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Mis trabajos</h1>
        <p className="mt-2 text-sm text-muted">
          Las fotos que subas se muestran en la página, en la sección de
          trabajos, bajo tu nombre.
        </p>
      </div>

      {!barber ? (
        <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
          Tu cuenta aún no está vinculada a un barbero. Pídele al administrador
          que la conecte.
        </div>
      ) : (
        <WorksManager works={works} />
      )}
    </div>
  );
}