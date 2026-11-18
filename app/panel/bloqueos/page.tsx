import { connection } from "next/server";
import { Trash2 } from "lucide-react";
import { BlockForm } from "@/components/block-form";
import { getOwnBarber } from "@/lib/barber";
import { createClient } from "@/lib/supabase/server";
import { deleteBlock } from "@/app/panel/bloqueos/actions";

const TZ = "America/Bogota";

type Block = { id: string; reason: string | null; starts_at: string; ends_at: string };

function nowInfo() {
  const now = new Date();
  return {
    iso: now.toISOString(),
    today: now.toLocaleDateString("en-CA", { timeZone: TZ }),
  };
}

function formatBlock(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const day = new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const t1 = time.format(start);
  const t2 = time.format(end);

  if (t1 === "00:00" && t2 === "00:00") {
    const last = new Date(end.getTime() - 60_000);
    const d1 = day.format(start);
    const d2 = day.format(last);
    return d1 === d2 ? `${d1} · todo el día` : `${d1} → ${d2} · días completos`;
  }

  const d1 = day.format(start);
  const d2 = day.format(end);
  return d1 === d2 ? `${d1} · ${t1} – ${t2}` : `${d1} ${t1} → ${d2} ${t2}`;
}

export default async function BlocksPage() {
  await connection();
  const { barber } = await getOwnBarber();
  const { iso, today } = nowInfo();

  let blocks: Block[] = [];
  if (barber) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("time_blocks")
      .select("id,reason,starts_at,ends_at")
      .eq("barber_id", barber.id)
      .gte("ends_at", iso)
      .order("starts_at");
    blocks = (data ?? []) as Block[];
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Agenda</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          Descansos y bloqueos
        </h1>
        <p className="mt-2 text-sm text-muted">
          Bloquea un almuerzo largo, una cita médica, un permiso o tus
          vacaciones. Esos espacios no se podrán reservar.
        </p>
      </div>

      {!barber ? (
        <div className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
          Tu cuenta aún no está vinculada a un barbero. Pídele al administrador
          que la conecte.
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-5 font-display text-xl">Nuevo bloqueo</h2>
            <BlockForm today={today} />
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl">
              Próximos bloqueos ({blocks.length})
            </h2>

            {blocks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-6 text-sm text-muted">
                No tienes bloqueos programados.
              </p>
            ) : (
              blocks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {b.reason ?? "Bloqueo"}
                    </p>
                    <p className="text-sm capitalize text-muted">
                      {formatBlock(b.starts_at, b.ends_at)}
                    </p>
                  </div>
                  <form action={deleteBlock}>
                    <input type="hidden" name="id" value={b.id} />
                    <button
                      aria-label="Eliminar bloqueo"
                      title="Eliminar"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line transition hover:border-red-500/50 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}