import { cache } from "react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type OwnBarber = {
  id: string;
  name: string;
  role_title: string | null;
  bio: string | null;
  specialties: string[] | null;
  photo_url: string | null;
};

// El barbero que está dentro de su panel (o null si su cuenta no está vinculada)
export const getOwnBarber = cache(async () => {
  const session = await requireRole("barber");
  const supabase = await createClient();
  const { data } = await supabase
    .from("barbers")
    .select("id,name,role_title,bio,specialties,photo_url")
    .eq("user_id", session.user.id)
    .maybeSingle();

  return { session, barber: (data as OwnBarber | null) ?? null };
});

// Solo se aceptan fotos que estén en nuestro almacenamiento
export function isOwnMediaUrl(url: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return (
    Boolean(base) &&
    url.startsWith(`${base}/storage/v1/object/public/media/`)
  );
}

export function mediaPathFromUrl(url: string) {
  const marker = "/storage/v1/object/public/media/";
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}