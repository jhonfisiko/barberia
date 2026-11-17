import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

export default async function AdminHome() {
  const supabase = await createClient();
  const session = await getSessionProfile();

  const [barbers, services, pending] = await Promise.all([
    supabase.from("barbers").select("*", { count: "exact", head: true }),
    supabase.from("services").select("*", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const cards = [
    { label: "Barberos", value: barbers.count ?? 0 },
    { label: "Servicios", value: services.count ?? 0 },
    { label: "Citas pendientes", value: pending.count ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Resumen</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          Hola, {session?.name}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Desde aquí administrarás barberos, servicios, horarios y citas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-line bg-surface p-6"
          >
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-2 font-display text-4xl">{c.value}</p>
          </div>
        ))}
      </div>

      <Link
        href="/"
        target="_blank"
        className="inline-block rounded-full border border-line px-5 py-2.5 text-sm transition hover:border-fg"
      >
        Ver sitio público ↗
      </Link>
    </div>
  );
}