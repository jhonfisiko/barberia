"use client";

import { useActionState } from "react";
import {
  saveOwnProfile,
  type ProfileState,
} from "@/app/panel/perfil/actions";
import { ImageUpload } from "@/components/image-upload";
import type { OwnBarber } from "@/lib/barber";

const initial: ProfileState = {};

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none transition focus:border-fg";

export function OwnProfileForm({ barber }: { barber: OwnBarber }) {
  const [state, action, pending] = useActionState(saveOwnProfile, initial);
  const v = state.values;

  return (
    <form action={action} className="space-y-4">
      <ImageUpload
        key={state.stamp ?? "init"}
        name="photo_url"
        folder="barbers"
        defaultUrl={v?.photo_url ?? barber.photo_url ?? ""}
        label="Mi foto de perfil"
      />

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-widest text-muted">
          Sobre mí
        </label>
        <textarea
          name="bio"
          rows={4}
          maxLength={400}
          defaultValue={v?.bio ?? barber.bio ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs uppercase tracking-widest text-muted">
          Especialidades (separadas por coma)
        </label>
        <input
          name="specialties"
          placeholder="Fade, Barba, Clásico"
          defaultValue={v?.specialties ?? (barber.specialties ?? []).join(", ")}
          className={inputClass}
        />
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
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}