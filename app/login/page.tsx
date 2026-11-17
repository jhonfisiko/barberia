import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Acceso · wearco Barber Estudio",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="text-sm text-muted hover:text-fg">
          ← Volver al sitio
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">
            wearco Barber Estudio
          </p>
          <h1 className="mb-6 mt-2 font-display text-3xl">Acceso al panel</h1>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}