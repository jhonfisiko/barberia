import Link from "next/link";
import { getOwnBarber } from "@/lib/barber";

export default async function PanelHome() {
  const { session, barber } = await getOwnBarber();

  const links = [
        {
      href: "/panel/agenda",
      title: "Mi agenda",
      text: "Mira tus citas del día y de la semana, y acéptalas o aplázalas.",
    },
    {
      href: "/panel/perfil",
      title: "Mi perfil",
      text: "Cambia tu foto, tu descripción y tus especialidades.",
    },
    {
      href: "/panel/trabajos",
      title: "Mis trabajos",
      text: "Sube fotos de tus cortes para mostrarlas en la página.",
    },
        {
      href: "/panel/bloqueos",
      title: "Descansos y bloqueos",
      text: "Bloquea almuerzos, permisos o vacaciones.",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Inicio</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          Hola, {barber?.name ?? session.name}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Pronto aquí verás tu agenda y tus citas, y podrás bloquear tus
          descansos.
        </p>
      </div>

      {!barber ? (
        <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
          Tu cuenta aún no está vinculada a un barbero. Pídele al administrador
          que la conecte.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-2xl border border-line bg-surface p-6 transition hover:border-fg"
            >
              <p className="font-display text-xl">{l.title}</p>
              <p className="mt-2 text-sm text-muted">{l.text}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}