"use client";

import { useActionState, useState } from "react";
import { saveSettings } from "@/app/admin/ajustes/actions";
import type { SimpleState } from "@/app/admin/barberos/actions";

export type SettingsInitial = {
  name: string;
  whatsapp: string;
  address: string;
  hours_text: string;
  slot_minutes: number;
  open_time: string;
  close_time: string;
  closed_days: number[];
};

const initial: SimpleState = {};

const DAYS: [number, string][] = [
  [1, "Lunes"],
  [2, "Martes"],
  [3, "Miércoles"],
  [4, "Jueves"],
  [5, "Viernes"],
  [6, "Sábado"],
  [0, "Domingo"],
];

const SLOTS = [15, 20, 30, 45, 60];

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none transition focus:border-fg";

function normalizePhone(v: string) {
  const digits = v.replace(/\D/g, "");
  return /^3\d{9}$/.test(digits) ? "57" + digits : digits;
}

export function SettingsForm({ initial: init }: { initial: SettingsInitial }) {
  const [state, action, pending] = useActionState(saveSettings, initial);

  const [name, setName] = useState(init.name);
  const [whatsapp, setWhatsapp] = useState(init.whatsapp);
  const [address, setAddress] = useState(init.address);
  const [hoursText, setHoursText] = useState(init.hours_text);
  const [slot, setSlot] = useState(init.slot_minutes);
  const [open, setOpen] = useState(init.open_time);
  const [close, setClose] = useState(init.close_time);
  const [closed, setClosed] = useState<number[]>(init.closed_days);

  const toggleDay = (wd: number) =>
    setClosed((prev) =>
      prev.includes(wd) ? prev.filter((d) => d !== wd) : [...prev, wd]
    );

  return (
    <form action={action} className="space-y-10">
      {/* Contacto */}
      <section className="space-y-4 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-display text-xl">Datos del negocio</h2>

        <Field label="Nombre">
          <input
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="WhatsApp">
          <input
            name="whatsapp"
            type="tel"
            inputMode="numeric"
            placeholder="573001234567"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            onBlur={() => setWhatsapp(normalizePhone(whatsapp))}
            className={inputClass}
          />
          <p className="text-xs text-muted">
            Con código de país y sin “+” ni espacios. Si escribes un celular
            colombiano de 10 dígitos, se le agrega el 57.
          </p>
          {whatsapp.length >= 11 && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm underline underline-offset-4"
            >
              Probar el enlace de WhatsApp ↗
            </a>
          )}
        </Field>

        <Field label="Dirección">
          <input
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Texto de horario (se muestra en la web)">
          <input
            name="hours_text"
            placeholder="Lun a Sáb · 9:00 a.m. – 7:00 p.m."
            value={hoursText}
            onChange={(e) => setHoursText(e.target.value)}
            className={inputClass}
          />
        </Field>
      </section>

      {/* Reservas */}
      <section className="space-y-5 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-display text-xl">Reservas</h2>

        <Field label="Una cita cada">
          <select
            name="slot_minutes"
            value={slot}
            onChange={(e) => setSlot(Number(e.target.value))}
            className={inputClass}
          >
            {SLOTS.map((m) => (
              <option key={m} value={m}>
                {m} minutos
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Abre">
            <input
              name="open_time"
              type="time"
              step={900}
              required
              value={open}
              onChange={(e) => setOpen(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Cierra">
            <input
              name="close_time"
              type="time"
              step={900}
              required
              value={close}
              onChange={(e) => setClose(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs uppercase tracking-widest text-muted">
            Días que el negocio cierra
          </legend>
          <div className="flex flex-wrap gap-2 pt-1">
            {DAYS.map(([wd, label]) => {
              const on = closed.includes(wd);
              return (
                <label
                  key={wd}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition ${
                    on
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line bg-bg hover:border-fg"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="closed"
                    value={wd}
                    checked={on}
                    onChange={() => toggleDay(wd)}
                    className="sr-only"
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <p className="text-xs text-muted">
          Cuando activemos las reservas reales, las horas disponibles saldrán
          del horario de cada barbero. Estos datos seguirán sirviendo para el
          intervalo entre citas y los días en que todo el negocio cierra.
        </p>
      </section>

      {state.error && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sm text-muted">Ajustes guardados ✓</p>}

      <button
        disabled={pending}
        className="rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar ajustes"}
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