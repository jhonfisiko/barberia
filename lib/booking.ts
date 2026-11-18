import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Celular colombiano: 10 dígitos que empiezan por 3 (acepta +57 / 57 delante)
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("57")) d = d.slice(2);
  return /^3\d{9}$/.test(d) ? d : null;
}

export type QuoteLine = {
  service_id: string;
  name: string;
  minutes: number;
  price: number;
};

// Tiempo y precio reales para un barbero (usa sus valores propios si los tiene)
export async function quoteFor(serviceIds: string[], barberId: string) {
  const admin = createAdminClient();

  const [svcRes, linksRes] = await Promise.all([
    admin
      .from("services")
      .select("id,name,minutes,price")
      .in("id", serviceIds)
      .eq("active", true),
    admin
      .from("barber_services")
      .select("service_id,minutes,price")
      .eq("barber_id", barberId)
      .in("service_id", serviceIds),
  ]);

  const services = svcRes.data ?? [];
  if (services.length !== serviceIds.length) return null;
  const links = linksRes.data ?? [];

  const lines: QuoteLine[] = serviceIds.map((id) => {
    const s = services.find((x) => x.id === id)!;
    const l = links.find((x) => x.service_id === id);
    return {
      service_id: id,
      name: s.name as string,
      minutes: ((l?.minutes as number | null) ?? s.minutes) as number,
      price: ((l?.price as number | null) ?? s.price) as number,
    };
  });

  return {
    lines,
    minutes: lines.reduce((sum, l) => sum + l.minutes, 0),
    price: lines.reduce((sum, l) => sum + l.price, 0),
  };
}