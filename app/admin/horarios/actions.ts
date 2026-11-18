"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SimpleState } from "@/app/admin/barberos/actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const NAMES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

type Pair = [string, string];
type DayInput = { on: boolean; t1: Pair; t2: Pair };

function isPair(v: unknown): v is Pair {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === "string" &&
    typeof v[1] === "string"
  );
}

function parseSchedule(raw: string): DayInput[] | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || data.length !== 7) return null;
    const out: DayInput[] = [];
    for (const d of data) {
      if (
        typeof d !== "object" ||
        d === null ||
        typeof (d as DayInput).on !== "boolean" ||
        !isPair((d as DayInput).t1) ||
        !isPair((d as DayInput).t2)
      )
        return null;
      out.push(d as DayInput);
    }
    return out;
  } catch {
    return null;
  }
}

export async function saveHours(
  _prev: SimpleState,
  formData: FormData
): Promise<SimpleState> {
  await requireRole("owner");

  const barberId = String(formData.get("barber_id") ?? "");
  if (!UUID.test(barberId)) return { error: "Falta el barbero." };

  const days = parseSchedule(String(formData.get("schedule") ?? ""));
  if (!days) return { error: "No se pudo leer el horario. Recarga la página." };

  const rows: {
    barber_id: string;
    weekday: number;
    start_time: string;
    end_time: string;
  }[] = [];

  for (let wd = 0; wd < 7; wd++) {
    const day = days[wd];
    if (!day.on) continue;

    const tramos = [day.t1, day.t2].filter(([a, b]) => a || b);
    if (tramos.length === 0)
      return {
        error: `Escribe el horario del ${NAMES[wd]} o márcalo como cerrado.`,
      };

    for (const [a, b] of tramos) {
      if (!TIME.test(a) || !TIME.test(b))
        return { error: `Completa las horas del ${NAMES[wd]}.` };
      if (b <= a)
        return {
          error: `En el ${NAMES[wd]}, la hora final debe ser después de la inicial.`,
        };
    }

    const sorted = [...tramos].sort((x, y) => x[0].localeCompare(y[0]));
    if (sorted.length === 2 && sorted[1][0] < sorted[0][1])
      return { error: `Los dos tramos del ${NAMES[wd]} se cruzan.` };

    for (const [a, b] of sorted) {
      rows.push({ barber_id: barberId, weekday: wd, start_time: a, end_time: b });
    }
  }

  const supabase = await createClient();

  // Primero se guardan los nuevos y luego se borran los anteriores,
  // para no perder el horario si algo falla a la mitad.
  const { data: old } = await supabase
    .from("barber_hours")
    .select("id")
    .eq("barber_id", barberId);

  if (rows.length > 0) {
    const { error } = await supabase.from("barber_hours").insert(rows);
    if (error) return { error: "No se pudo guardar: " + error.message };
  }

  const oldIds = (old ?? []).map((r) => r.id as string);
  if (oldIds.length > 0) {
    const { error } = await supabase
      .from("barber_hours")
      .delete()
      .in("id", oldIds);
    if (error) return { error: "No se pudo guardar: " + error.message };
  }

  revalidatePath("/admin/horarios");
  return { ok: true };
}