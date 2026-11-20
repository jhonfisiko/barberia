export const TZ = "America/Bogota";
const DAY_MS = 24 * 60 * 60 * 1000;
const KEY = /^\d{4}-\d{2}-\d{2}$/;

export type Appt = {
  id: string;
  customer_name: string;
  customer_phone: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  cancel_reason: string | null;
  total_price: number | null;
  appointment_services:
    | { service_name: string; minutes: number; price: number }[]
    | null;
};

export type Block = {
  id: string;
  reason: string | null;
  starts_at: string;
  ends_at: string;
};

export type HourRow = {
  weekday: number;
  start_time: string;
  end_time: string;
};

// Fechas como "AAAA-MM-DD" en hora de Colombia (sin cambio de horario: UTC-5)
export function todayKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

export function isKey(v: string | undefined): v is string {
  if (!v || !KEY.test(v)) return false;
  const d = new Date(`${v}T12:00:00-05:00`);
  return (
    !Number.isNaN(d.getTime()) &&
    d.toLocaleDateString("en-CA", { timeZone: TZ }) === v
  );
}

export function addDays(key: string, n: number) {
  const d = new Date(`${key}T12:00:00-05:00`);
  return new Date(d.getTime() + n * DAY_MS).toLocaleDateString("en-CA", {
    timeZone: TZ,
  });
}

// 0 = domingo ... 6 = sábado
export function weekdayOf(key: string) {
  return new Date(`${key}T12:00:00-05:00`).getUTCDay();
}

// Semana de lunes a domingo
export function weekKeys(key: string) {
  const monday = addDays(key, -((weekdayOf(key) + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function dayBounds(key: string) {
  const start = new Date(`${key}T00:00:00-05:00`);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-CO", { timeZone: TZ, ...opts });

export const dayLong = (key: string) =>
  fmt({ weekday: "long", day: "numeric", month: "long" }).format(
    new Date(`${key}T12:00:00-05:00`)
  );

export const dayShort = (key: string) =>
  fmt({ weekday: "short", day: "numeric", month: "short" }).format(
    new Date(`${key}T12:00:00-05:00`)
  );

export const timeLabel = (iso: string | Date) =>
  fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    new Date(iso)
  );

export const dateValue = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });

export function overlaps(
  aStart: string,
  aEnd: string,
  from: Date,
  to: Date
) {
  return new Date(aStart) < to && new Date(aEnd) > from;
}

// Parte de un bloqueo que cae dentro de un día
export function blockRangeForDay(b: Block, start: Date, end: Date) {
  const s = new Date(Math.max(new Date(b.starts_at).getTime(), start.getTime()));
  const e = new Date(Math.min(new Date(b.ends_at).getTime(), end.getTime()));
  const fromStart = s.getTime() === start.getTime();
  const toEnd = e.getTime() === end.getTime();
  if (fromStart && toEnd) return "Todo el día";
  return `${fromStart ? "00:00" : timeLabel(s)} – ${toEnd ? "24:00" : timeLabel(e)}`;
}

// Número listo para wa.me (celular colombiano de 10 dígitos: se agrega el 57)
export function phoneForWhatsApp(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (/^3\d{9}$/.test(digits)) return "57" + digits;
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}
// Hora actual en milisegundos. Va en una función aparte para no llamar a
// Date.now() directamente dentro de una página.
export function currentTimeMs() {
  return Date.now();
}