"use client";

import { useActionState } from "react";
import {
  createBarberAccount,
  resetBarberPassword,
  type SimpleState,
} from "@/app/admin/barberos/actions";

const initial: SimpleState = {};

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none transition focus:border-fg";

export function BarberAccess({
  barberId,
  email,
}: {
  barberId: string;
  email: string | null;
}) {
  return email ? (
    <ResetForm barberId={barberId} email={email} />
  ) : (
    <CreateForm barberId={barberId} />
  );
}

function CreateForm({ barberId }: { barberId: string }) {
  const [state, action, pending] = useActionState(createBarberAccount, initial);

  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-muted">
        Este barbero aún no tiene acceso. Créale un correo y una contraseña para
        que entre a su panel.
      </p>
      <input type="hidden" name="barber_id" value={barberId} />
      <input
        name="email"
        type="email"
        placeholder="Correo"
        autoComplete="off"
        required
        className={inputClass}
      />
      <input
        name="password"
        type="text"
        placeholder="Contraseña (mínimo 8 caracteres)"
        autoComplete="off"
        minLength={8}
        required
        className={inputClass}
      />
      {state.error && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear acceso"}
      </button>
    </form>
  );
}

function ResetForm({ barberId, email }: { barberId: string; email: string }) {
  const [state, action, pending] = useActionState(resetBarberPassword, initial);

  return (
    <form action={action} className="space-y-3">
      <p className="text-sm">
        Entra con: <span className="font-medium">{email}</span>
      </p>
      <input type="hidden" name="barber_id" value={barberId} />
      <input
        name="password"
        type="text"
        placeholder="Nueva contraseña (mínimo 8 caracteres)"
        autoComplete="off"
        minLength={8}
        required
        className={inputClass}
      />
      {state.error && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sm text-muted">Contraseña cambiada ✓</p>}
      <button
        disabled={pending}
        className="rounded-full border border-line px-5 py-2.5 text-sm transition hover:border-fg disabled:opacity-60"
      >
        {pending ? "Cambiando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}