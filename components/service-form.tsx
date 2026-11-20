"use client";

import { useActionState } from "react";
import { saveService, type ServiceState } from "@/app/admin/servicios/actions";
import { ImageUpload } from "@/components/image-upload";

export type AdminService = {
  id: string;
  name: string;
  description: string | null;
  minutes: number;
  price: number;
  popular: boolean | null;
  active: boolean | null;
  image_url: string | null;
};

const initial: ServiceState = {};

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none transition focus:border-fg";

export function ServiceForm({ service }: { service?: AdminService }) {
  const [state, action, pending] = useActionState(saveService, initial);
  const v = state.values;

  return (
    <form action={action} className="space-y-4">
      {service && <input type="hidden" name="id" value={service.id} />}

      <ImageUpload
        key={state.stamp ?? "init"}
        name="image_url"
        folder="services"
        defaultUrl={v?.image_url ?? service?.image_url ?? ""}
        label="Foto del servicio"
      />

      <Field label="Nombre">
        <input
          name="name"
          required
          defaultValue={v?.name ?? service?.name ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Descripción">
        <textarea
          name="description"
          rows={2}
          defaultValue={v?.description ?? service?.description ?? ""}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Duración (min)">
          <input
            name="minutes"
            type="number"
            inputMode="numeric"
            min={5}
            step={5}
            required
            defaultValue={v?.minutes ?? service?.minutes ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Precio (COP)">
          <input
            name="price"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            required
            defaultValue={v?.price ?? service?.price ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="popular"
          defaultChecked={v ? v.popular : (service?.popular ?? false)}
          className="h-4 w-4"
        />
        Marcar como “lo más pedido”
      </label>

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
        {pending ? "Guardando…" : service ? "Guardar cambios" : "Crear servicio"}
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