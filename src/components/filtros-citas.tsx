"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { DatePicker } from "@/components/date-picker";
import { cn } from "@/lib/cn";
import { hoyCr } from "@/lib/timezone";

const ESTADOS = ["", "AGENDADA", "RECORDADA", "COMPLETADA", "CANCELADA"];

export function FiltrosCitas() {
  const router = useRouter();
  const params = useSearchParams();

  const set = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      router.push(`/panel/citas?${next.toString()}`);
    },
    [params, router],
  );

  const desde = params.get("desde") ?? "";
  const hasta = params.get("hasta") ?? "";
  const unDia = desde && desde === hasta ? desde : "";
  const esHoy = unDia === hoyCr();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 border-b border-zinc-100 pb-4">
        <div>
          <label className="etiqueta">Ver un día</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => set({ desde: hoyCr(), hasta: hoyCr() })}
              className={cn("btn-secundario", esHoy && "border-marca bg-marca-suave text-marca")}
            >
              Hoy
            </button>
            <DatePicker
              value={unDia}
              onChange={(v) => set({ desde: v, hasta: v })}
              placeholder="Elegir un día"
            />
          </div>
        </div>
        {(desde || hasta) && (
          <button
            className="text-sm text-zinc-400 underline hover:text-zinc-700"
            onClick={() => set({ desde: "", hasta: "" })}
          >
            Quitar filtro de fecha
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <label className="etiqueta">Buscar</label>
          <input
            className="campo"
            placeholder="Nombre, correo o teléfono"
            defaultValue={params.get("q") ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") set({ q: (e.target as HTMLInputElement).value });
            }}
            onBlur={(e) => set({ q: e.target.value })}
          />
        </div>
        <div>
          <label className="etiqueta">Estado</label>
          <select
            className="campo"
            defaultValue={params.get("estado") ?? ""}
            onChange={(e) => set({ estado: e.target.value })}
          >
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {s === "" ? "Todos" : s[0] + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className="etiqueta">Desde</label>
          <DatePicker value={desde} onChange={(v) => set({ desde: v })} placeholder="Cualquiera" />
        </div>
        <div className="w-40">
          <label className="etiqueta">Hasta</label>
          <DatePicker value={hasta} onChange={(v) => set({ hasta: v })} placeholder="Cualquiera" />
        </div>
        {[...params.keys()].length > 0 && (
          <button className="btn-secundario" onClick={() => router.push("/panel/citas")}>
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
