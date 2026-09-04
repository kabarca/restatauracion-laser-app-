"use client";

import { useRouter } from "next/navigation";

const ESTADOS = ["", "AGENDADA", "RECORDADA", "COMPLETADA", "CANCELADA"];

/** Selector de estado para la vista de calendario — conserva mes y vista. */
export function EstadoFiltroRapido({ estado, mes }: { estado?: string; mes: string }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-zinc-500" htmlFor="estado-cal">
        Estado
      </label>
      <select
        id="estado-cal"
        defaultValue={estado ?? ""}
        className="campo max-w-40 py-1.5 text-sm"
        onChange={(e) => {
          const p = new URLSearchParams({ vista: "calendario", mes });
          if (e.target.value) p.set("estado", e.target.value);
          router.push(`/panel/citas?${p.toString()}`);
        }}
      >
        {ESTADOS.map((s) => (
          <option key={s} value={s}>
            {s === "" ? "Todos" : s[0] + s.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
