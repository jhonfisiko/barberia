import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "owner" | "barber";

export const getSessionProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return null;

  return {
    user,
    role: profile.role as Role,
    name: (profile.full_name as string | null) ?? user.email ?? "Usuario",
  };
});

// Exige sesión y rol; si no cumple, redirige
export async function requireRole(role: Role) {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  if (session.role !== role) {
    redirect(session.role === "owner" ? "/admin" : "/panel");
  }
  return session;
}