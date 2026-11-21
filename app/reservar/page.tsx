import { redirect } from "next/navigation";

export const metadata = { robots: { index: false, follow: false } };

// Dirección corta para el QR: lleva directo a la sección de reservar
export default function ReservarRedirect() {
  redirect("/?origen=qr#reservar");
}