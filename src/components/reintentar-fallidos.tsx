"use client";

import { useState, useTransition } from "react";
import { reintentarFallidos } from "@/app/panel/citas/actions";

export function ReintentarFallidos({ cantidad }: { cantidad: number }) {
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        className="btn-secundario"
        disabled={pending || cantidad === 0}
        onClick={() =>
          startTransition(async () => {
            const r = await reintentarFallidos();
            setResultado(
              r.intentados === 0
                ? "No había envíos fallidos pendientes."
                : `Reintentados ${r.intentados}: ${r.ok} ok, ${r.fallidos} siguen fallando.`,
            );
          })
        }
      >
        {pending ? "Reintentando…" : "Reintentar todos los fallidos"}
      </button>
      {resultado && <span className="text-sm text-zinc-500">{resultado}</span>}
    </div>
  );
}
