import { Suspense } from "react";
import { PanelShell } from "@/components/panel-shell";
import { requireRole } from "@/lib/auth";

export const metadata = {
  title: "Mi panel · wearco Barber Estudio",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/panel", label: "Inicio" },
  { href: "/panel/agenda", label: "Mi agenda", ready: false },
  { href: "/panel/bloqueos", label: "Descansos", ready: false },
  { href: "/panel/trabajos", label: "Mis trabajos", ready: false },
  { href: "/panel/perfil", label: "Mi perfil", ready: false },
];

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <PanelGate>{children}</PanelGate>
    </Suspense>
  );
}

async function PanelGate({ children }: { children: React.ReactNode }) {
  const session = await requireRole("barber");
  return (
    <PanelShell roleLabel="Barbero" userName={session.name} nav={NAV}>
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