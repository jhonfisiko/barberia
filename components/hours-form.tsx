"use client";

import { useActionState, useState } from "react";
import { saveHours } from "@/app/admin/horarios/actions";
import type { SimpleState } from "@/app/admin/barberos/actions";

export type HourRow = {
  weekday: number;
  start_time: string;
  end_time: string;
};

type Pair = [string, string];
type DayState = { on: boolean; t1: Pair; t2: Pair };

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const initial: SimpleState = {};

const timeInput =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition focus:border-fg";

function fromRows(rows: HourRow[]): DayState[] {
  return Array.from({ length: 7 }, (_, wd) => {
    const mine = rows
      .filter((r) => r.weekday === wd)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    const pair = (i: number): Pair =>
      mine[i]
        ? [mine[i].start_time.slice(0, 5), mine[i].end_time.slice(0, 5)]
        : ["", ""];
    return { on: mine.length > 0, t1: pair(0), t2: pair(1) };
  });
}

export function HoursForm({
  barberId,
  rows,
}: {
  barberId: string;
  rows: HourRow[];
}) {
  const [state, action, pending] = useActionState(saveHours, initial);
  const [days, setDays] = useState<DayState[]>(() => fromRows(rows));

  const update = (wd: number, patch: Partial<DayState>) =>
    setDays((prev) => prev.map((d, i) => (i === wd ? { ...d, ...patch } : d)));

  const toggle = (wd: number, on: boolean) =>
    update(
      wd,
      on && !days[wd].t1[0] ? { on, t1: ["09:00", "19:00"] } : { on }
    );

  // Copia la configuración del lunes a martes–sábado
  const copyMonday = () =>
    setDays((prev) =>
      prev.map((d, i) => (i >= 2 && i <= 6 ? { ...prev[1] } : d))
    );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="barber_id" value={barberId} />
      <input type="hidden" name="schedule" value={JSON.stringify(days)} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Activa los días que trabaja y escribe sus horas. Usa el segundo tramo
          para dejar libre el almuerzo.
        </p>
        <button
          type="button"
          onClick={copyMonday}
          className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-fg"
        >
          Copiar lunes a mar–sáb
        </button>
      </div>

      <div className="space-y-3">
        {ORDER.map((wd) => {
          const d = days[wd];
          return (
            <div
              key={wd}
              className="space-y-3 rounded-xl border border-line bg-bg p-4"
            >
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={d.on}
                  onChange={(e) => toggle(wd, e.target.checked)}
                  className="h-4 w-4 shrink-0"
                />
                <span className="flex-1 text-sm font-medium">{NAMES[wd]}</span>
                {!d.on && <span className="text-xs text-muted">Cerrado</span>}
              </label>

              {d.on && (
                <div className="space-y-3 pl-7">
                  <Tramo
                    label="Tramo 1"
                    value={d.t1}
                    onChange={(t1) => update(wd, { t1 })}
                  />
                  <Tramo
                    label="Tramo 2 (opcional)"
                    value={d.t2}
                    onChange={(t2) => update(wd, { t2 })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sm text-muted">Horario guardado ✓</p>}

      <button
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar horario"}
      </button>
    </form>
  );
}

function Tramo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Pair;
  onChange: (v: Pair) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs uppercase tracking-widest text-muted">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="time"
          step={900}
          value={value[0]}
          onChange={(e) => onChange([e.target.value, value[1]])}
          aria-label={`${label}: desde`}
          className={timeInput}
        />
        <input
          type="time"
          step={900}
          value={value[1]}
          onChange={(e) => onChange([value[0], e.target.value])}
          aria-label={`${label}: hasta`}
          className={timeInput}
        />
      </div>
    </div>
  );
}