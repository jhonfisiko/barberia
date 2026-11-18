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
// "14:30" → "2:30 p. m."
export function timeLabel12(t: string) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "p. m." : "a. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}