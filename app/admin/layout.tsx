import { Suspense } from "react";
import { PanelShell } from "@/components/panel-shell";
import { requireRole } from "@/lib/auth";

export const metadata = {
  title: "Administrador · wearco Barber Studio",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/barberos", label: "Barberos" },
  { href: "/admin/servicios", label: "Servicios" },
  { href: "/admin/horarios", label: "Horarios"},
  { href: "/admin/citas", label: "Citas", ready: false },
  { href: "/admin/ajustes", label: "Ajustes" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  const session = await requireRole("owner");
  return (
    <PanelShell
      roleLabel="Administrador"
      userName={session.name}
      nav={NAV}
    >
      {children}
    </PanelShell>
  );
}

function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center text-sm text-muted">
      Cargando…
    </div>
  );
}