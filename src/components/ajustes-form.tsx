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

export function AjustesForm({
  diasRecordatorioDefault,
  recordatorioMismoDiaDefault,
  encuestaHabilitada,
  encuestaDiasDespues,
}: {
  diasRecordatorioDefault: number;
  recordatorioMismoDiaDefault: boolean;
  encuestaHabilitada: boolean;
  encuestaDiasDespues: number;
}) {
  const [state, action] = useActionState(guardarAjustes, { ok: false });
  return (
    <form action={action} className="tarjeta space-y-5">
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

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="recordatorioMismoDiaDefault"
          defaultChecked={recordatorioMismoDiaDefault}
          className="mt-0.5"
        />
        <span>
          <span className="font-medium text-zinc-800">Recordatorio adicional el mismo día</span>
          <span className="block text-xs text-zinc-400">
            Además del recordatorio de N días antes, enviar otro la mañana de la cita. Se
            marca por defecto en las citas nuevas (cada cita puede cambiarlo).
          </span>
        </span>
      </label>

      <div className="border-t border-zinc-200 pt-4">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="encuestaHabilitada"
            defaultChecked={encuestaHabilitada}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium text-zinc-800">Encuesta de satisfacción post-servicio</span>
            <span className="block text-xs text-zinc-400">
              Enviar por correo un enlace a una encuesta corta después de la cita.
            </span>
          </span>
        </label>
        <div className="mt-3">
          <label className="etiqueta" htmlFor="encuestaDiasDespues">
            Días después de la cita para enviarla
          </label>
          <input
            id="encuestaDiasDespues"
            name="encuestaDiasDespues"
            type="number"
            min={0}
            max={30}
            defaultValue={encuestaDiasDespues}
            className="campo max-w-32"
          />
        </div>
      </div>

      {state.ok && <p className="text-sm text-emerald-600">Ajustes guardados.</p>}
      <Enviar />
    </form>
  );
}
