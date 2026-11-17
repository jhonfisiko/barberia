"use client";

import { useActionState } from "react";
import { saveBarber, type BarberState } from "@/app/admin/barberos/actions";
import { ImageUpload } from "@/components/image-upload";

export type AdminBarber = {
  id: string;
  name: string;
  role_title: string | null;
  bio: string | null;
  specialties: string[] | null;
  photo_url: string | null;
  active: boolean | null;
  user_id: string | null;
  email: string | null;
};

const initial: BarberState = {};

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none transition focus:border-fg";

export function BarberForm({ barber }: { barber?: AdminBarber }) {
  const [state, action, pending] = useActionState(saveBarber, initial);
  const v = state.values;

  return (
    <form action={action} className="space-y-4">
      {barber && <input type="hidden" name="id" value={barber.id} />}

      <ImageUpload
        key={state.stamp ?? "init"}
        name="photo_url"
        folder="barbers"
        defaultUrl={v?.photo_url ?? barber?.photo_url ?? ""}
        label="Foto de perfil"
      />

      <Field label="Nombre">
        <input
          name="name"
          required
          defaultValue={v?.name ?? barber?.name ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Cargo">
        <input
          name="role_title"
          placeholder="Barbero"
          defaultValue={v?.role_title ?? barber?.role_title ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Descripción">
        <textarea
          name="bio"
          rows={3}
          defaultValue={v?.bio ?? barber?.bio ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Especialidades (separadas por coma)">
        <input
          name="specialties"
          placeholder="Fade, Barba, Clásico"
          defaultValue={
            v?.specialties ?? (barber?.specialties ?? []).join(", ")
          }
          className={inputClass}
        />
      </Field>

      {state.error && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sm text-muted">Guardado ✓</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Guardando…" : barber ? "Guardar cambios" : "Crear barbero"}
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