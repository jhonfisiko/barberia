import { createClient } from "@/lib/supabase/server";
import { ServiceForm, type AdminService } from "@/components/service-form";
import { ServiceRow } from "@/components/service-row";

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id,name,description,minutes,price,popular,active,image_url")
    .order("sort_order");

  const services = (data ?? []) as AdminService[];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">
          Catálogo
        </p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Servicios</h1>
        <p className="mt-2 text-sm text-muted">
          Lo que cambies aquí se actualiza en la página pública.
        </p>
      </div>

      <section className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-5 font-display text-xl">Nuevo servicio</h2>
        <ServiceForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">
          Servicios actuales ({services.length})
        </h2>
        {services.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay servicios.</p>
        ) : (
          services.map((s) => <ServiceRow key={s.id} service={s} />)
        )}
      </section>
    </div>
  );
}