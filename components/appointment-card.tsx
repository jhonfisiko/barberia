"use client";

import { useActionState } from "react";
import { MessageCircle } from "lucide-react";
import {
  acceptAppointment,
  cancelAppointment,
  completeAppointment,
  rescheduleAppointment,
  type AgendaState,
} from "@/app/panel/agenda/actions";

export type CardAppt = {
  id: string;
  status: string;
  customer: string;
  phone: string;
  services: string;
  price: string;
  timeRange: string;
  dateValue: string;
  timeValue: string;
  notes: string | null;
  cancelReason: string | null;
  waUrl: string | null;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "border-amber-500/50 text-amber-500" },
  confirmed: {
    label: "Confirmada",
    cls: "border-emerald-500/50 text-emerald-500",
  },
  cancelled: { label: "Cancelada", cls: "border-line text-muted" },
  done: { label: "Atendida", cls: "border-line text-muted" },
};

const initial: AgendaState = {};

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none transition focus:border-fg";

const summaryClass =
  "inline-block cursor-pointer list-none rounded-full border border-line px-4 py-2 text-sm transition hover:border-fg [&::-webkit-details-marker]:hidden";

export function AppointmentCard({
  appt,
  today,
}: {
  appt: CardAppt;
  today: string;
}) {
  const st = STATUS[appt.status] ?? STATUS.pending;
  const active = appt.status === "pending" || appt.status === "confirmed";

  return (
    <div
      className={`rounded-2xl border border-line bg-surface p-5 ${
        appt.status === "cancelled" ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={`font-display text-2xl ${
            appt.status === "cancelled" ? "line-through" : ""
          }`}
        >
          {appt.timeRange}
        </p>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wide ${st.cls}`}
        >
          {st.label}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-sm">
        <p className="font-medium">{appt.customer}</p>
        <a
          href={`tel:${appt.phone}`}
          className="text-muted underline-offset-4 hover:underline"
        >
          {appt.phone}
        </a>
        <p className="text-muted">
          {appt.services} · {appt.price}
        </p>
        {appt.notes && <p className="text-muted">Nota: {appt.notes}</p>}
        {appt.cancelReason && (
          <p className="text-muted">Motivo: {appt.cancelReason}</p>
        )}
      </div>

      {(active || (appt.waUrl && appt.status === "cancelled")) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {appt.status === "pending" && (
            <form action={acceptAppointment}>
              <input type="hidden" name="id" value={appt.id} />
              <button className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90">
                Aceptar
              </button>
            </form>
          )}

          {appt.status === "confirmed" && (
            <form action={completeAppointment}>
              <input type="hidden" name="id" value={appt.id} />
              <button className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-fg transition hover:opacity-90">
                Marcar atendida
              </button>
            </form>
          )}

          {appt.waUrl && (
            <a
              href={appt.waUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition hover:border-fg"
            >
              <MessageCircle size={14} /> Avisar por WhatsApp
            </a>
          )}
        </div>
      )}

      {active && (
        <div className="mt-3 space-y-2">
          <details>
            <summary className={summaryClass}>Aplazar</summary>
            <RescheduleForm appt={appt} today={today} />
          </details>
          <details>
            <summary
              className={`${summaryClass} text-red-500 hover:border-red-500/50`}
            >
              Cancelar
            </summary>
            <CancelForm id={appt.id} />
          </details>
        </div>
      )}
    </div>
  );
}

function RescheduleForm({ appt, today }: { appt: CardAppt; today: string }) {
  const [state, action, pending] = useActionState(
    rescheduleAppointment,
    initial
  );

  return (
    <form action={action} className="mt-3 space-y-3 rounded-xl bg-bg p-4">
      <input type="hidden" name="id" value={appt.id} />
      <div className="grid grid-cols-2 gap-3">
        <input
          name="date"
          type="date"
          required
          min={today}
          defaultValue={appt.dateValue}
          aria-label="Nueva fecha"
          className={inputClass}
        />
        <input
          name="time"
          type="time"
          step={900}
          required
          defaultValue={appt.timeValue}
          aria-label="Nueva hora"
          className={inputClass}
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Moviendo…" : "Mover cita"}
      </button>
    </form>
  );
}

function CancelForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(cancelAppointment, initial);

  return (
    <form action={action} className="mt-3 space-y-3 rounded-xl bg-bg p-4">
      <input type="hidden" name="id" value={id} />
      <input
        name="reason"
        required
        maxLength={200}
        placeholder="Motivo (se le dirá al cliente)"
        className={inputClass}
      />
      {state.error && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="rounded-full border border-red-500/40 px-5 py-2.5 text-sm text-red-500 transition hover:bg-red-500/10 disabled:opacity-60"
      >
        {pending ? "Cancelando…" : "Cancelar cita"}
      </button>
    </form>
  );
}