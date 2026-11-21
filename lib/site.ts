// Datos del sitio para SEO, vista previa al compartir y QR.
// Si NEXT_PUBLIC_SITE_URL no está definida, se usa el dominio de Vercel.
const raw =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_URL = raw.replace(/\/+$/, "");

export const SITE_NAME = "Wearco Barber Studio";
export const SITE_TAGLINE = "Cortes, barba y cuidado personal";

// Escribe aquí la ciudad del local (por ejemplo "Tu ciudad") para mejorar la
// búsqueda local en Google. Déjala vacía si prefieres no ponerla.
export const SITE_CITY = "";

export const SITE_DESCRIPTION = `Barbería${
  SITE_CITY ? ` en ${SITE_CITY}` : ""
}: cortes, fades, barba y más. Elige tu servicio o tu barbero y reserva tu cita en línea en menos de un minuto.`;