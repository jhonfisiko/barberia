import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BarberForm, type AdminBarber } from "@/components/barber-form";
import { BarberRow } from "@/components/barber-row";
import type {
  AssignedService,
  ServiceLite,
} from "@/components/barber-services-form";

export default async function BarbersPage() {
  const supabase = await createClient();

  const [barbersRes, servicesRes, linksRes] = await Promise.all([
    supabase
      .from("barbers")
      .select("id,name,role_title,bio,specialties,photo_url,active,user_id")
      .order("sort_order"),
    supabase
      .from("services")
      .select("id,name,minutes,price")
      .order("sort_order"),
    supabase
      .from("barber_services")
      .select("barber_id,service_id,minutes,price"),
  ]);

  const services = (servicesRes.data ?? []) as ServiceLite[];
  const links = (linksRes.data ?? []) as AssignedService[];

  const admin = createAdminClient();
  const barbers: AdminBarber[] = await Promise.all(
    (barbersRes.data ?? []).map(async (b) => {
      let email: string | null = null;
      if (b.user_id) {
        const { data: u } = await admin.auth.admin.getUserById(b.user_id);
        email = u.user?.email ?? null;
      }
      return { ...b, email } as AdminBarber;
    })
  );

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Equipo</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Barberos</h1>
        <p className="mt-2 text-sm text-muted">
          Crea barberos, súbeles la foto, elige qué servicios hacen y dales
          acceso a su propio panel.
        </p>
      </div>

      <section className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-5 font-display text-xl">Nuevo barbero</h2>
        <BarberForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">
          Barberos actuales ({barbers.length})
        </h2>
        {barbers.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay barberos.</p>
        ) : (
          barbers.map((b) => (
            <BarberRow
              key={b.id}
              barber={b}
              services={services}
              assigned={links.filter((l) => l.barber_id === b.id)}
            />
          ))
        )}
      </section>
    </div>
  );
}