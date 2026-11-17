"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  ["#populares", "Lo más pedido"],
  ["#servicios", "Servicios"],
  ["#barberos", "Barberos"],
  ["#trabajos", "Trabajos"],
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        aria-label="Menú"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-16 border-b border-line bg-bg px-5 py-4 shadow-lg">
          <ul className="space-y-1">
            {LINKS.map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base hover:bg-surface"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#reservar"
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-full bg-accent px-5 py-3 text-center text-sm font-medium text-accent-fg"
          >
            Reservar cita
          </a>
        </nav>
      )}
    </div>
  );
}