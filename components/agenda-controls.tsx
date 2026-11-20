import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays } from "@/lib/agenda";

export function AgendaControls({
  basePath,
  date,
  view,
  today,
  extra = "",
}: {
  basePath: string;
  date: string;
  view: "day" | "week";
  today: string;
  extra?: string;
}) {
  const step = view === "week" ? 7 : 1;
  const href = (d: string, v: string) => `${basePath}?d=${d}&v=${v}${extra}`;
  const iconBtn =
    "flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface transition hover:border-fg";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Link
          href={href(addDays(date, -step), view)}
          aria-label="Anterior"
          className={iconBtn}
        >
          <ChevronLeft size={18} />
        </Link>
        <Link
          href={href(today, view)}
          className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm transition hover:border-fg"
        >
          Hoy
        </Link>
        <Link
          href={href(addDays(date, step), view)}
          aria-label="Siguiente"
          className={iconBtn}
        >
          <ChevronRight size={18} />
        </Link>
      </div>

      <div className="grid grid-cols-2 rounded-full border border-line bg-surface p-1">
        {(
          [
            ["day", "Día"],
            ["week", "Semana"],
          ] as const
        ).map(([v, label]) => (
          <Link
            key={v}
            href={href(date, v)}
            className={`rounded-full px-5 py-2 text-center text-sm transition ${
              view === v
                ? "bg-accent text-accent-fg"
                : "text-muted hover:text-fg"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}