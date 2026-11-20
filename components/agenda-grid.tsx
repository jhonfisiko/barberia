"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { AppointmentCard } from "@/components/appointment-card";
import { dayLong } from "@/lib/agenda";
import {
  fmtDuration,
  freeIntervals,
  gridRange,
  offRanges,
  type GridColumn,
} from "@/lib/agenda-grid";

const HOUR_PX = 64;
const PX = HOUR_PX / 60;
const GUTTER = 56;
const COL = 144;

const STATUS_CLASS: Record<string, string> = {
  pending: "border-amber-500 bg-amber-500/20",
  confirmed: "border-emerald-500 bg-emerald-500/25",
  done: "border-muted bg-line/70 opacity-70",
};

const hourLabel = (h: number) =>
  `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "a. m." : "p. m."}`;

export function AgendaGrid({
  columns,
  today,
}: {
  columns: GridColumn[];
  today: string;
}) {
  const { startHour, endHour } = gridRange(columns);
  const startMin = startHour * 60;
  const endMin = endHour * 60;
  const total = (endMin - startMin) * PX;
  const y = (m: number) => (m - startMin) * PX;
  const clip = (s: number, e: number): [number, number] | null => {
    const a = Math.max(s, startMin);
    const b = Math.min(e, endMin);
    return b > a ? [a, b] : null;
  };
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Al abrir el día de hoy, la grilla se desplaza cerca de la hora actual
  const nowCol = columns.find((c) => c.nowMin !== null);
  const initialScroll =
    nowCol?.nowMin != null
      ? Math.max(0, y(Math.floor(nowCol.nowMin / 60) * 60) - 80)
      : 0;

  useEffect(() => {
    if (scrollRef.current && initialScroll > 0)
      scrollRef.current.scrollTop = initialScroll;
  }, [initialScroll]);

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  // Si la cita se cancela o se mueve de día, el detalle se cierra solo
  const selected = selectedId
    ? (columns.flatMap((c) => c.appts).find((a) => a.id === selectedId) ?? null)
    : null;

  const manyDays = new Set(columns.map((c) => c.dayKey)).size > 1;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
        <Legend className="border-amber-500 bg-amber-500/20" label="Por aceptar" />
        <Legend className="border-emerald-500 bg-emerald-500/25" label="Confirmada" />
        <Legend className="border-muted bg-line/70" label="Atendida" />
        <Legend className="border-transparent bg-emerald-500/15" label="Libre" />
        <Legend className="border-dashed border-muted" label="Bloqueado / fuera de horario" />
      </div>

      <div
        ref={scrollRef}
        className="max-h-[75svh] overflow-auto rounded-2xl border border-line bg-surface"
      >
        <div style={{ minWidth: GUTTER + columns.length * COL }}>
          {/* Encabezados */}
          <div className="sticky top-0 z-30 flex border-b border-line bg-surface">
            <div className="sticky left-0 z-40 w-14 shrink-0 bg-surface" />
            {columns.map((c) => {
              const highlight = manyDays && c.dayKey === today;
              const head = (
                <>
                  <p className="truncate text-sm font-medium capitalize">
                    {c.title}
                  </p>
                  {c.subtitle && (
                    <p className="truncate text-xs text-muted">{c.subtitle}</p>
                  )}
                </>
              );
              return (
                <div
                  key={c.id}
                  className={`min-w-36 flex-1 border-l border-line px-3 py-2.5 ${
                    highlight ? "border-b-2 border-b-accent" : ""
                  }`}
                >
                  {c.href ? (
                    <Link href={c.href} className="block hover:opacity-80">
                      {head}
                    </Link>
                  ) : (
                    head
                  )}
                </div>
              );
            })}
          </div>

          {/* Cuerpo */}
          <div className="flex">
            <div
              className="sticky left-0 z-20 w-14 shrink-0 bg-surface"
              style={{ height: total }}
            >
              {hours.map((h) => (
                <span
                  key={h}
                  className="absolute right-2 text-[11px] text-muted"
                  style={{ top: y(h * 60) + 2 }}
                >
                  {hourLabel(h)}
                </span>
              ))}
            </div>

            {columns.map((c) => {
              const past = c.nowMin !== null ? clip(0, c.nowMin) : null;
              return (
                <div
                  key={c.id}
                  className="relative min-w-36 flex-1 border-l border-line"
                  style={{ height: total }}
                >
                  {/* Horario de trabajo */}
                  {c.work.map(([s, e], i) => {
                    const r = clip(s, e);
                    return (
                      r && (
                        <div
                          key={i}
                          className="absolute inset-x-0 bg-emerald-500/[0.08]"
                          style={{ top: y(r[0]), height: (r[1] - r[0]) * PX }}
                        />
                      )
                    );
                  })}

                  {/* Fuera de horario (rayado) */}
                  {offRanges(c).map(([s, e], i) => {
                    const r = clip(s, e);
                    return (
                      r && (
                        <div
                          key={i}
                          className="absolute inset-x-0 opacity-60"
                          style={{
                            top: y(r[0]),
                            height: (r[1] - r[0]) * PX,
                            backgroundImage:
                              "repeating-linear-gradient(135deg, transparent 0 6px, var(--line) 6px 7px)",
                          }}
                        />
                      )
                    );
                  })}

                  {/* Líneas de hora y media hora */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-t border-line/80"
                      style={{ top: y(h * 60) }}
                    />
                  ))}
                  {hours.map((h) => (
                    <div
                      key={`${h}-30`}
                      className="absolute inset-x-0 border-t border-dashed border-line/40"
                      style={{ top: y(h * 60 + 30) }}
                    />
                  ))}

                  {/* Huecos libres */}
                  {freeIntervals(c)
                    .filter(([s, e]) => e - s >= 30)
                    .map(([s, e], i) => {
                      const r = clip(s, e);
                      return (
                        r && (
                          <div
                            key={i}
                            className="pointer-events-none absolute inset-x-1 flex items-center justify-center text-[11px] text-emerald-500/90"
                            style={{
                              top: y(r[0]),
                              height: (r[1] - r[0]) * PX,
                            }}
                          >
                            Libre · {fmtDuration(e - s)}
                          </div>
                        )
                      );
                    })}

                  {/* Lo que ya pasó hoy */}
                  {past && (
                    <div
                      className="pointer-events-none absolute inset-x-0 bg-bg/50"
                      style={{ top: y(past[0]), height: (past[1] - past[0]) * PX }}
                    />
                  )}

                  {/* Bloqueos */}
                  {c.blocks.map((b) => {
                    const r = clip(b.startMin, b.endMin);
                    return (
                      r && (
                        <div
                          key={b.id}
                          className="absolute inset-x-1 z-10 overflow-hidden rounded-lg border border-dashed border-muted/60 px-2 py-1 text-[11px] text-muted"
                          style={{
                            top: y(r[0]),
                            height: (r[1] - r[0]) * PX,
                            backgroundColor: "var(--surface)",
                            backgroundImage:
                              "repeating-linear-gradient(135deg, transparent 0 5px, var(--line) 5px 6px)",
                          }}
                        >
                          <span className="font-medium">{b.label}</span>
                        </div>
                      )
                    );
                  })}

                  {/* Citas */}
                  {c.appts.map((a) => {
                    const r = clip(a.startMin, a.endMin);
                    if (!r) return null;
                    const h = (r[1] - r[0]) * PX;
                    return (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => setSelectedId(a.id)}
                        className={`absolute inset-x-1 z-10 overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left text-xs transition hover:brightness-125 ${
                          STATUS_CLASS[a.status] ?? STATUS_CLASS.pending
                        }`}
                        style={{ top: y(r[0]), height: Math.max(h - 2, 22) }}
                      >
                        <span className="block truncate font-medium">
                          {a.customer}
                        </span>
                        {h >= 44 && (
                          <span className="block truncate text-[11px] opacity-80">
                            {a.timeRange}
                          </span>
                        )}
                        {h >= 70 && (
                          <span className="block truncate text-[11px] opacity-70">
                            {a.services}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Hora actual */}
                  {c.nowMin !== null &&
                    c.nowMin >= startMin &&
                    c.nowMin <= endMin && (
                      <div
                        className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                        style={{ top: y(c.nowMin) }}
                      >
                        <span className="-ml-1 h-2 w-2 rounded-full bg-red-500" />
                        <span className="h-px flex-1 bg-red-500" />
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detalle de la cita */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
          onClick={() => setSelectedId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90svh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-line bg-bg p-4 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm capitalize text-muted">
                {dayLong(selected.card.dateValue)}
              </p>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setSelectedId(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line"
              >
                <X size={16} />
              </button>
            </div>
            <AppointmentCard appt={selected.card} today={today} />
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded border ${className}`} />
      {label}
    </span>
  );
}