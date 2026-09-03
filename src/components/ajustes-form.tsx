"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { guardarAjustes } from "@/app/panel/ajustes/actions";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primario" disabled={pending}>
      {pending ? "Guardando…" : "Guardar"}
    </button>
  );
}

export function AjustesForm({ diasRecordatorioDefault }: { diasRecordatorioDefault: number }) {
  const [state, action] = useActionState(guardarAjustes, { ok: false });
  return (
    <form action={action} className="tarjeta space-y-4">
      <div>
        <label className="etiqueta" htmlFor="diasRecordatorioDefault">
          Días antes para el recordatorio (por defecto)
        </label>
        <input
          id="diasRecordatorioDefault"
          name="diasRecordatorioDefault"
          type="number"
          min={0}
          max={30}
          defaultValue={diasRecordatorioDefault}
          className="campo max-w-32"
        />
        <p className="mt-1 text-xs text-zinc-400">
          Se aplica a las citas nuevas. Cada cita puede sobreescribirlo al crearla.
        </p>
      </div>
      {state.ok && <p className="text-sm text-emerald-600">Ajustes guardados.</p>}
      <Enviar />
    </form>
  );
}
