/* eslint-disable @next/next/no-img-element */
"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { addWork, deleteWork, type WorkState } from "@/app/panel/trabajos/actions";
import { ImageUpload } from "@/components/image-upload";

export type OwnWork = {
  id: string;
  title: string | null;
  image_url: string;
};

const initial: WorkState = {};

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none transition focus:border-fg";

export function WorksManager({ works }: { works: OwnWork[] }) {
  const [state, action, pending] = useActionState(addWork, initial);

  return (
    <div className="space-y-10">
      <section className="space-y-4 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-display text-xl">Subir un trabajo</h2>
        <form action={action} className="space-y-4">
          <ImageUpload
            key={state.stamp ?? "init"}
            name="image_url"
            folder="works"
            label="Foto del corte"
          />

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-muted">
              Título (opcional)
            </label>
            <input
              name="title"
              maxLength={60}
              placeholder="Low fade, Barba perfilada…"
              className={inputClass}
            />
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-red-500">
              {state.error}
            </p>
          )}
          {state.ok && (
            <p className="text-sm text-muted">
              Publicado ✓ Ya aparece en la página.
            </p>
          )}

          <button
            disabled={pending}
            className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Publicando…" : "Publicar trabajo"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl">Mis trabajos ({works.length})</h2>

        {works.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-6 text-sm text-muted">
            Todavía no has subido trabajos.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {works.map((w) => (
              <div
                key={w.id}
                className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-surface"
              >
                <img
                  src={w.image_url}
                  alt={w.title ?? "Trabajo"}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {w.title && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-sm text-white">
                    {w.title}
                  </div>
                )}

                <form
                  action={deleteWork}
                  onSubmit={(e) => {
                    if (!confirm("¿Eliminar este trabajo?")) e.preventDefault();
                  }}
                  className="absolute right-2 top-2"
                >
                  <input type="hidden" name="id" value={w.id} />
                  <button
                    aria-label="Eliminar trabajo"
                    title="Eliminar"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}