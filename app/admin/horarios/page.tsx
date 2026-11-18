import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { HoursForm, type HourRow } from "@/components/hours-form";

export default async function HoursPage() {
  const supabase = await createClient();

  const [barbersRes, hoursRes] = await Promise.all([
    supabase.from("barbers").select("id,name,role_title").order("sort_order"),
    supabase
      .from("barber_hours")
      .select("barber_id,weekday,start_time,end_time"),
  ]);

  const barbers = barbersRes.data ?? [];
  const hours = (hoursRes.data ?? []) as (HourRow & { barber_id: string })[];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Agenda</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Horarios</h1>
        <p className="mt-2 text-sm text-muted">
          El horario semanal de cada barbero. Con él se calcularán las horas
          disponibles para reservar.
        </p>
      </div>

      {barbers.length === 0 ? (
        <p className="text-sm text-muted">
          Primero crea barberos en la pestaña Barberos.
        </p>
      ) : (
        <div className="space-y-3">
          {barbers.map((b) => {
            const mine = hours.filter((h) => h.barber_id === b.id);
            const openDays = new Set(mine.map((h) => h.weekday)).size;
            return (
              <div
                key={b.id}
                className="rounded-2xl border border-line bg-surface"
              >
                <details className="group" open={barbers.length === 1}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{b.name}</p>
                      <p className="text-sm text-muted">
                        {openDays === 0
                          ? "Sin horario"
                          : `${openDays} días a la semana`}
                      </p>
                    </div>
                    <ChevronDown
                      size={18}
                      className="shrink-0 text-muted transition group-open:rotate-180"
                    />
                  </summary>
                  <div className="border-t border-line p-5">
                    <HoursForm barberId={b.id} rows={mine} />
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}