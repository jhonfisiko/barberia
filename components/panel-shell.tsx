import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PanelNav, type NavItem } from "@/components/panel-nav";
import { signOut } from "@/app/auth/actions";

export function PanelShell({
  roleLabel,
  userName,
  nav,
  children,
}: {
  roleLabel: string;
  userName: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="truncate font-display text-lg">wearco</span>
              <span className="shrink-0 rounded-full border border-line px-3 py-1 text-[11px] uppercase tracking-widest text-muted">
                {roleLabel}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden max-w-40 truncate text-sm text-muted sm:block">
                {userName}
              </span>
              <ThemeToggle />
              <form action={signOut}>
                <button
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg transition hover:opacity-80"
                >
                  <LogOut size={16} />
                </button>
              </form>
            </div>
          </div>
          <PanelNav items={nav} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 md:py-10">{children}</main>
    </div>
  );
}