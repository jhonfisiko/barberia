"use client";

import { ChevronDown } from "lucide-react";
import { deleteService, toggleService } from "@/app/admin/servicios/actions";
import { ServiceForm, type AdminService } from "@/components/service-form";
import { formatPrice } from "@/lib/format";

export function ServiceRow({ service }: { service: AdminService }) {
  const hidden = service.active === false;

  return (
    <div
      className={`rounded-2xl border border-line bg-surface ${
        hidden ? "opacity-60" : ""
      }`}
    >
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <p className="truncate font-medium">{service.name}</p>
            <p className="text-sm text-muted">
              {formatPrice(service.price)} · {service.minutes} min
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {service.popular && <Badge>Más pedido</Badge>}
            {hidden && <Badge>Oculto</Badge>}
            <ChevronDown
              size={18}
              className="text-muted transition group-open:rotate-180"
            />
          </div>
        </summary>

        <div className="space-y-6 border-t border-line p-5">
          <ServiceForm service={service} />

          <div className="flex flex-wrap gap-3 border-t border-line pt-5">
            <form action={toggleService}>
              <input type="hidden" name="id" value={service.id} />
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
              action={deleteService}
              onSubmit={(e) => {
                if (
                  !confirm(
                    `¿Eliminar “${service.name}”? Esta acción no se puede deshacer.`
                  )
                )
                  e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={service.id} />
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