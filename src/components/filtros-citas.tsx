"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

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

  return (
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
      <div>
        <label className="etiqueta">Desde</label>
        <input
          type="date"
          className="campo"
          defaultValue={params.get("desde") ?? ""}
          onChange={(e) => set({ desde: e.target.value })}
        />
      </div>
      <div>
        <label className="etiqueta">Hasta</label>
        <input
          type="date"
          className="campo"
          defaultValue={params.get("hasta") ?? ""}
          onChange={(e) => set({ hasta: e.target.value })}
        />
      </div>
      {[...params.keys()].length > 0 && (
        <button className="btn-secundario" onClick={() => router.push("/panel/citas")}>
          Limpiar
        </button>
      )}
    </div>
  );
}
