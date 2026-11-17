/* eslint-disable @next/next/no-img-element */
"use client";

import { ChevronDown } from "lucide-react";
import { deleteBarber, toggleBarber } from "@/app/admin/barberos/actions";
import { BarberForm, type AdminBarber } from "@/components/barber-form";
import { BarberAccess } from "@/components/barber-access";
import {
  BarberServicesForm,
  type AssignedService,
  type ServiceLite,
} from "@/components/barber-services-form";

export function BarberRow({
  barber,
  services,
  assigned,
}: {
  barber: AdminBarber;
  services: ServiceLite[];
  assigned: AssignedService[];
}) {
  const hidden = barber.active === false;

  return (
    <div
      className={`rounded-2xl border border-line bg-surface ${
        hidden ? "opacity-60" : ""
      }`}
    >
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-line to-muted/40 font-display text-lg">
              {barber.photo_url ? (
                <img
                  src={barber.photo_url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                barber.name.charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{barber.name}</p>
              <p className="truncate text-sm text-muted">
                {barber.role_title ?? "Barbero"} · {assigned.length} servicios
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge>{barber.user_id ? "Con acceso" : "Sin acceso"}</Badge>
            {hidden && <Badge>Oculto</Badge>}
            <ChevronDown
              size={18}
              className="text-muted transition group-open:rotate-180"
            />
          </div>
        </summary>

        <div className="space-y-8 border-t border-line p-5">
          <BarberForm barber={barber} />

          <div className="space-y-3 border-t border-line pt-6">
            <h3 className="font-display text-lg">Servicios que hace</h3>
            <BarberServicesForm
              barberId={barber.id}
              services={services}
              assigned={assigned}
            />
          </div>

          <div className="space-y-3 border-t border-line pt-6">
            <h3 className="font-display text-lg">Acceso al panel</h3>
            <BarberAccess barberId={barber.id} email={barber.email} />
          </div>

          <div className="flex flex-wrap gap-3 border-t border-line pt-5">
            <form action={toggleBarber}>
              <input type="hidden" name="id" value={barber.id} />
              <input
                type="hidden"
                name="active"
                value={hidden ? "true" : "false"}
              />
              <button className="rounded-full border border-line px-5 py-2.5 text-sm transition hover:border-fg">
                {hidden ? "Mostrar en la web" : "Ocultar de la web"}
              </button>
            </form>

            <form
              action={deleteBarber}
              onSubmit={(e) => {
                if (
                  !confirm(
                    `¿Eliminar a “${barber.name}”? Se borrarán sus trabajos, horarios y su cuenta de acceso. Esta acción no se puede deshacer.`
                  )
                )
                  e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={barber.id} />
              <button className="rounded-full border border-red-500/40 px-5 py-2.5 text-sm text-red-500 transition hover:bg-red-500/10">
                Eliminar
              </button>
            </form>
          </div>
        </div>
      </details>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-muted">
      {children}
    </span>
  );
}