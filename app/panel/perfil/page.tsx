import { OwnProfileForm } from "@/components/own-profile-form";
import { getOwnBarber } from "@/lib/barber";

export default async function ProfilePage() {
  const { barber } = await getOwnBarber();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">
          Mi cuenta
        </p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Mi perfil</h1>
        <p className="mt-2 text-sm text-muted">
          Esto es lo que ven los clientes en la sección de barberos.
        </p>
      </div>

      {!barber ? (
        <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
          Tu cuenta aún no está vinculada a un barbero. Pídele al administrador
          que la conecte.
        </div>
      ) : (
        <section className="space-y-6 rounded-2xl border border-line bg-surface p-6">
          <div>
            <p className="font-display text-2xl">{barber.name}</p>
            <p className="text-sm text-muted">
              {barber.role_title ?? "Barbero"} · el nombre y el cargo los
              cambia el administrador
            </p>
          </div>
          <OwnProfileForm barber={barber} />
        </section>
      )}
    </div>
  );
}