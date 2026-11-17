export const formatPrice = (n: number) => "$" + n.toLocaleString("es-CO");

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// Genera las horas del día: ej. 09:00, 09:30, 10:00...
export function buildTimes(open: string, close: string, step: number) {
  const out: string[] = [];
  const s = step > 0 ? step : 30;
  for (let t = toMinutes(open); t + s <= toMinutes(close); t += s) {
    const h = String(Math.floor(t / 60)).padStart(2, "0");
    const m = String(t % 60).padStart(2, "0");
    out.push(`${h}:${m}`);
  }
  return out;
}