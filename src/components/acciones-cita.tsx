"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  reprogramarCita,
  cancelarCita,
  marcarEstado,
  reenviarMensaje,
  reenviarConfirmacion,
  alternarRecordatorioMismoDia,
  enviarEncuesta,
  type FormState,
} from "@/app/panel/citas/actions";
import { DatePicker } from "@/components/date-picker";
import { TimePicker } from "@/components/time-picker";
import type { EstadoCita } from "@/generated/prisma";

function Boton({ children, className = "btn-secundario" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "…" : children}
    </button>
  );
}

export function AccionesCita({
  citaId,
  estado,
  fechaDefault,
  horaDefault,
  recordatorioMismoDia,
  tieneEncuesta,
}: {
  citaId: string;
  estado: EstadoCita;
  fechaDefault: string;
  horaDefault: string;
  recordatorioMismoDia: boolean;
  tieneEncuesta: boolean;
}) {
  const [abrir, setAbrir] = useState<"reprogramar" | "cancelar" | null>(null);
  const [fecha, setFecha] = useState(fechaDefault);
  const [hora, setHora] = useState(horaDefault);
  const [repState, repAction] = useActionState<FormState, FormData>(
    reprogramarCita.bind(null, citaId),
    { ok: false },
  );
  const [canState, canAction] = useActionState<FormState, FormData>(
    cancelarCita.bind(null, citaId),
    { ok: false },
  );

  const cancelada = estado === "CANCELADA";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {estado !== "COMPLETADA" && !cancelada && (
          <form action={marcarEstado.bind(null, citaId, "COMPLETADA")}>
            <Boton className="btn-secundario">Marcar completada</Boton>
          </form>
        )}
        {estado === "COMPLETADA" && (
          <form action={marcarEstado.bind(null, citaId, "AGENDADA")}>
            <Boton className="btn-secundario">Reabrir</Boton>
          </form>
        )}
        {!cancelada && (
          <>
            <button className="btn-secundario" onClick={() => setAbrir(abrir === "reprogramar" ? null : "reprogramar")}>
              Reprogramar
            </button>
            <button className="btn-peligro" onClick={() => setAbrir(abrir === "cancelar" ? null : "cancelar")}>
              Cancelar cita
            </button>
          </>
        )}
        <form action={reenviarConfirmacion.bind(null, citaId)}>
          <Boton className="btn-secundario">Reenviar confirmación</Boton>
        </form>
        {!cancelada && !tieneEncuesta && (
          <form action={enviarEncuesta.bind(null, citaId)}>
            <Boton className="btn-secundario">Enviar encuesta</Boton>
          </form>
        )}
      </div>

      {!cancelada && (
        <form action={alternarRecordatorioMismoDia.bind(null, citaId, !recordatorioMismoDia)}>
          <Boton className="btn-secundario">
            {recordatorioMismoDia
              ? "Desactivar recordatorio del mismo día"
              : "Activar recordatorio del mismo día"}
          </Boton>
        </form>
      )}

      {abrir === "reprogramar" && (
        <form action={repAction} className="tarjeta space-y-3">
          <p className="text-sm font-medium text-zinc-900">Nueva fecha y hora</p>
          <div className="flex flex-wrap items-start gap-3">
            <div className="w-48">
              <DatePicker name="fecha" value={fecha} onChange={setFecha} />
            </div>
            <div className="w-36">
              <TimePicker name="hora" value={hora} onChange={setHora} />
            </div>
            <Boton className="btn-primario">Guardar y avisar</Boton>
          </div>
          {repState.error && <p className="text-sm text-red-600">{repState.error}</p>}
          {repState.ok && <p className="text-sm text-emerald-600">Cita reprogramada y aviso enviado.</p>}
          <p className="text-xs text-zinc-400">
            Se reenvía la confirmación y el recordatorio vuelve a quedar pendiente.
          </p>
        </form>
      )}

      {abrir === "cancelar" && (
        <form action={canAction} className="tarjeta space-y-3">
          <p className="text-sm font-medium text-zinc-900">Cancelar esta cita</p>
          <textarea
            name="motivo"
            rows={2}
            placeholder="Motivo (opcional, aparece en el correo al cliente)"
            className="campo"
          />
          <Boton className="btn-peligro">Confirmar cancelación</Boton>
          {canState.ok && <p className="text-sm text-emerald-600">Cita cancelada y cliente avisado.</p>}
        </form>
      )}
    </div>
  );
}

export function ReintentarMensaje({ citaId, mensajeLogId }: { citaId: string; mensajeLogId: string }) {
  return (
    <form action={reenviarMensaje.bind(null, citaId, mensajeLogId)}>
      <button type="submit" className="text-xs font-medium text-zinc-900 underline hover:no-underline">
        Reintentar
      </button>
    </form>
  );
}
