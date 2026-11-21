import { QrCard } from "@/components/qr-card";
import { SITE_URL } from "@/lib/site";

export default function QrPage() {
  const url = `${SITE_URL}/reservar`;
  const local = SITE_URL.includes("localhost");
  const temporary = SITE_URL.includes("vercel.app");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">
          Promoción
        </p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Código QR</h1>
        <p className="mt-2 text-sm text-muted">
          Imprímelo y pégalo en la barbería: quien lo escanee llega directo a
          reservar su cita.
        </p>
      </div>

      {local && (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/40 p-5 text-sm"
        >
          Este código apunta a tu computador (localhost) y no sirve para
          imprimir. Abre este panel desde la página publicada, o define la
          variable NEXT_PUBLIC_SITE_URL.
        </div>
      )}

      {temporary && (
        <div className="rounded-2xl border border-amber-500/40 p-5 text-sm">
          Este código usa la dirección de prueba de Vercel. Funciona, pero antes
          de imprimirlo conviene conectar un dominio propio y volver a
          descargarlo desde aquí.
        </div>
      )}

      <QrCard url={url} fileName="qr-reservas" />

      <section className="space-y-3 rounded-2xl border border-line bg-surface p-6 text-sm">
        <h2 className="font-display text-xl">Para que se escanee bien</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-muted">
          <li>
            Tamaño mínimo de 3 × 3 cm para escanear de cerca (mostrador o
            espejo). Si va en la vitrina o la pared, de 8 a 10 cm.
          </li>
          <li>Negro sobre fondo blanco, sin invertir los colores ni cambiarlos.</li>
          <li>
            Ponle un texto cerca, como “Escanea y reserva tu cita”, para que la
            gente sepa para qué sirve.
          </li>
          <li>Pruébalo con dos celulares distintos antes de imprimir.</li>
          <li>
            No lo hagas en generadores “dinámicos” gratis: suelen dejar de
            funcionar o pedir pago. Este es permanente.
          </li>
        </ul>
      </section>
    </div>
  );
}