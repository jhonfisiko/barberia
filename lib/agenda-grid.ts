import type { CardAppt } from "@/components/appointment-card";
import {
  dateValue,
  dayBounds,
  dayLong,
  phoneForWhatsApp,
  timeLabel,
  weekdayOf,
  type Appt,
  type Block,
  type HourRow,
} from "@/lib/agenda";
import { formatPrice } from "@/lib/format";

export type GridAppt = {
  id: string;
  status: string;
  startMin: number;
  endMin: number;
  customer: string;
  services: string;
  timeRange: string;
  card: CardAppt;
};

export type GridBlock = {
  id: string;
  startMin: number;
  endMin: number;
  label: string;
};

export type GridColumn = {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
  dayKey: string;
  work: [number, number][];
  appts: GridAppt[];
  blocks: GridBlock[];
  nowMin: number | null;
};

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

function whatsappMessage(
  a: Appt,
  biz: string,
  barberName: string,
  services: string
) {
  const dateLabel = dayLong(dateValue(a.starts_at));
  const time = timeLabel(a.starts_at);
  const first = a.customer_name.split(" ")[0];

  if (a.status === "pending")
    return `Hola ${first}, recibimos tu solicitud de cita en ${biz}: ${services} con ${barberName}, ${dateLabel} a las ${time}. Te confirmamos en breve.`;
  if (a.status === "confirmed")
    return `Hola ${first}, tu cita en ${biz} está confirmada: ${services} con ${barberName}, ${dateLabel} a las ${time}. ¡Te esperamos!`;
  if (a.status === "cancelled")
    return `Hola ${first}, lamentamos avisarte que tuvimos que cancelar tu cita del ${dateLabel} a las ${time}${
      a.cancel_reason ? `. Motivo: ${a.cancel_reason}` : ""
    }. Escríbenos y la reagendamos.`;
  return "";
}

export function toCard(
  a: Appt,
  biz: string,
  barberName: string,
  showBarber = false
): CardAppt {
  const lines = a.appointment_services ?? [];
  const services = lines.map((s) => s.service_name).join(" + ") || "Servicio";
  const total =
    a.total_price && a.total_price > 0
      ? a.total_price
      : lines.reduce((sum, s) => sum + s.price, 0);

  const phone = phoneForWhatsApp(a.customer_phone);
  const msg = whatsappMessage(a, biz, barberName, services);

  return {
    id: a.id,
    status: a.status,
    customer: a.customer_name,
    phone: a.customer_phone,
    services,
    price: formatPrice(total),
    timeRange: `${timeLabel(a.starts_at)} – ${timeLabel(a.ends_at)}`,
    dateValue: dateValue(a.starts_at),
    timeValue: timeLabel(a.starts_at),
    notes: a.notes,
    cancelReason: a.cancel_reason,
    waUrl:
      phone && msg
        ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
        : null,
    barber: showBarber ? barberName : null,
  };
}

// Una columna de la grilla: un barbero en un día
export function buildColumn(o: {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
  dayKey: string;
  today: string;
  nowMs: number;
  hours: HourRow[];
  appts: Appt[];
  blocks: Block[];
  biz: string;
  barberName: string;
  showBarber?: boolean;
}): GridColumn {
  const { start, end } = dayBounds(o.dayKey);
  const wd = weekdayOf(o.dayKey);
  const clamp = (n: number) => Math.max(0, Math.min(1440, n));
  const minOf = (iso: string) =>
    clamp((new Date(iso).getTime() - start.getTime()) / 60000);

  const work = o.hours
    .filter((h) => h.weekday === wd)
    .map((h) => [toMin(h.start_time), toMin(h.end_time)] as [number, number])
    .sort((a, b) => a[0] - b[0]);

  // Las canceladas no ocupan el espacio: no se dibujan
  const appts: GridAppt[] = o.appts
    .filter(
      (a) =>
        a.status !== "cancelled" &&
        new Date(a.starts_at) < end &&
        new Date(a.ends_at) > start
    )
    .map((a) => {
      const card = toCard(a, o.biz, o.barberName, o.showBarber);
      return {
        id: a.id,
        status: a.status,
        startMin: minOf(a.starts_at),
        endMin: minOf(a.ends_at),
        customer: a.customer_name,
        services: card.services,
        timeRange: card.timeRange,
        card,
      };
    });

  const blocks: GridBlock[] = o.blocks
    .filter((b) => new Date(b.starts_at) < end && new Date(b.ends_at) > start)
    .map((b) => ({
      id: b.id,
      startMin: minOf(b.starts_at),
      endMin: minOf(b.ends_at),
      label: b.reason ?? "Bloqueo",
    }));

  return {
    id: o.id,
    title: o.title,
    subtitle: o.subtitle,
    href: o.href,
    dayKey: o.dayKey,
    work,
    appts,
    blocks,
    nowMin:
      o.dayKey === o.today ? clamp((o.nowMs - start.getTime()) / 60000) : null,
  };
}

// Rango de horas que se dibuja: del horario más temprano al más tarde
export function gridRange(columns: GridColumn[]) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const c of columns) {
    for (const [s, e] of c.work) {
      lo = Math.min(lo, s);
      hi = Math.max(hi, e);
    }
    for (const a of c.appts) {
      lo = Math.min(lo, a.startMin);
      hi = Math.max(hi, a.endMin);
    }
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    lo = 8 * 60;
    hi = 18 * 60;
  }
  const startHour = Math.max(0, Math.floor(lo / 60));
  let endHour = Math.min(24, Math.ceil(hi / 60));
  if (endHour - startHour < 4) endHour = Math.min(24, startHour + 4);
  return { startHour, endHour };
}

// Huecos: horario de trabajo menos citas y bloqueos (y menos lo que ya pasó hoy)
export function freeIntervals(col: GridColumn): [number, number][] {
  const busy = [
    ...col.appts.map((a) => [a.startMin, a.endMin] as [number, number]),
    ...col.blocks.map((b) => [b.startMin, b.endMin] as [number, number]),
  ].sort((a, b) => a[0] - b[0]);

  const out: [number, number][] = [];
  for (const [ws, we] of col.work) {
    let cursor = Math.max(ws, col.nowMin ?? 0);
    for (const [bs, be] of busy) {
      if (be <= cursor || bs >= we) continue;
      if (bs > cursor) out.push([cursor, Math.min(bs, we)]);
      cursor = Math.max(cursor, be);
      if (cursor >= we) break;
    }
    if (cursor < we) out.push([cursor, we]);
  }
  return out.filter(([s, e]) => e - s >= 15);
}

// Lo que está fuera del horario de trabajo (incluye el almuerzo)
export function offRanges(col: GridColumn): [number, number][] {
  const out: [number, number][] = [];
  let cursor = 0;
  for (const [s, e] of col.work) {
    if (s > cursor) out.push([cursor, s]);
    cursor = Math.max(cursor, e);
  }
  if (cursor < 1440) out.push([cursor, 1440]);
  return out;
}

export function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h && m) return `${h} h ${m} min`;
  return h ? `${h} h` : `${m} min`;
}