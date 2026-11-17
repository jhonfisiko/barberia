"use client";

import { useActionState } from "react";
import { saveBarberServices } from "@/app/admin/barberos/services-actions";
import type { SimpleState } from "@/app/admin/barberos/actions";
import { formatPrice } from "@/lib/format";

export type ServiceLite = {
  id: string;
  name: string;
  minutes: number;
  price: number;
};

export type AssignedService = {
  barber_id: string;
  service_id: string;
  minutes: number | null;
  price: number | null;
};

const initial: SimpleState = {};

const smallInput =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition focus:border-fg";

export function BarberServicesForm({
  barberId,
  services,
  assigned,
}: {
  barberId: string;
  services: ServiceLite[];
  assigned: AssignedService[];
}) {
  const [state, action, pending] = useActionState(
    saveBarberServices,
    initial
  );

  const byService = new Map(assigned.map((a) => [a.service_id, a]));
  const formKey = assigned
    .map((a) => `${a.service_id}:${a.minutes ?? ""}:${a.price ?? ""}`)
    .sort()
    .join("|");

  if (services.length === 0) {
    return (
      <p className="text-sm text-muted">
        Primero crea servicios en la pestaña Servicios.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="barber_id" value={barberId} />
      <p className="text-sm text-muted">
        Marca los servicios que hace este barbero. Si tarda distinto o cobra
        distinto, escribe su tiempo o su precio; si lo dejas vacío se usa el
        valor general del servicio.
      </p>

      <div key={formKey} className="space-y-3">
        {services.map((s) => {
          const cur = byService.get(s.id);
          return (
            <div
              key={s.id}
              className="space-y-3 rounded-xl border border-line bg-bg p-4"
            >
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name="svc"
                  value={s.id}
                  defaultChecked={Boolean(cur)}
                  className="h-4 w-4 shrink-0"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {s.name}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {formatPrice(s.price)} · {s.minutes} min
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2 pl-7">
                <input
                  name={`minutes_${s.id}`}
                  type="number"
                  inputMode="numeric"
                  min={5}
                  step={5}
                  placeholder={`${s.minutes} min`}
                  defaultValue={cur?.minutes ?? ""}
                  aria-label={`Tiempo de ${s.name}`}
                  className={smallInput}
                />
                <input
                  name={`price_${s.id}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={500}
                  placeholder={formatPrice(s.price)}
                  defaultValue={cur?.price ?? ""}
                  aria-label={`Precio de ${s.name}`}
                  className={smallInput}
                />
              </div>
            </div>
          );
        })}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sm text-muted">Guardado ✓</p>}

      <button
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar servicios"}
      </button>
    </form>
  );
}