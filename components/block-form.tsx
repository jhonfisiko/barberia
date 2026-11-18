"use client";

import { useActionState, useState } from "react";
import { addBlock, type BlockState } from "@/app/panel/bloqueos/actions";

const REASONS = [
  "Almuerzo",
  "Descanso",
  "Cita médica",
  "Permiso",
  "Vacaciones",
  "Otro",
];

const initial: BlockState = {};

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none transition focus:border-fg";

export function BlockForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(addBlock, initial);
  const [kind, setKind] = useState<"hours" | "days">("hours");

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />

      <Field label="Motivo">
        <select name="reason_type" defaultValue="Almuerzo" className={inputClass}>
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Detalle (opcional)">
        <input
          name="reason_note"
          maxLength={80}
          placeholder="Ej. control con el odontólogo"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 rounded-full border border-line bg-bg p-1">
        {(
          [
            ["hours", "Unas horas"],
            ["days", "Días completos"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setKind(value)}
            className={`rounded-full px-4 py-2.5 text-sm transition ${
              kind === value
                ? "bg-accent text-accent-fg"
                : "text-muted hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {kind === "hours" ? (
        <div className="space-y-3">
          <Field label="Día">
            <input
              name="date"
              type="date"
              required
              min={today}
              defaultValue={today}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde">
              <input
                name="from"
                type="time"
                step={900}
                required
                defaultValue="12:00"
                className={inputClass}
              />
            </Field>
            <Field label="Hasta">
              <input
                name="to"
                type="time"
                step={900}
                required
                defaultValue="14:00"
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Desde el">
            <input
              name="date_from"
              type="date"
              required
              min={today}
              defaultValue={today}
              className={inputClass}
            />
          </Field>
          <Field label="Hasta el">
            <input
              name="date_to"
              type="date"
              required
              min={today}
              defaultValue={today}
              className={inputClass}
            />
          </Field>
        </div>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sm text-muted">Bloqueo guardado ✓</p>}

      <button
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar bloqueo"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs uppercase tracking-widest text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}