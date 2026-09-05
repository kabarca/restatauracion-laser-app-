"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { crearCita, type FormState } from "@/app/panel/citas/actions";
import { SERVICIOS } from "@/lib/servicios";
import { TelefonoInput } from "@/components/telefono-input";
import { PreviewMensajes } from "@/components/preview-mensajes";
import { DatePicker } from "@/components/date-picker";
import { TimePicker } from "@/components/time-picker";
import { hoyCr } from "@/lib/timezone";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primario" disabled={pending}>
      {pending ? "Guardando y enviando confirmación…" : "Guardar cita y confirmar"}
    </button>
  );
}

export function CitaForm({
  diasRecordatorioDefault,
  recordatorioMismoDiaDefault,
  fechaDefault,
}: {
  diasRecordatorioDefault: number;
  recordatorioMismoDiaDefault: boolean;
  fechaDefault?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(crearCita, { ok: false });
  const fe = state.fieldErrors ?? {};

  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState(fechaDefault && fechaDefault >= hoyCr() ? fechaDefault : hoyCr());
  const [hora, setHora] = useState("09:00");
  const [servicio, setServicio] = useState("");

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <section className="tarjeta space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">Cliente</h2>
        <div>
          <label className="etiqueta" htmlFor="clienteNombre">
            Nombre
          </label>
          <input
            id="clienteNombre"
            name="clienteNombre"
            required
            className="campo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          {fe.clienteNombre && <p className="mt-1 text-sm text-red-600">{fe.clienteNombre[0]}</p>}
        </div>
        <div>
          <label className="etiqueta" htmlFor="clienteEmail">
            Correo electrónico
          </label>
          <input id="clienteEmail" name="clienteEmail" type="email" required className="campo" />
          {fe.clienteEmail && <p className="mt-1 text-sm text-red-600">{fe.clienteEmail[0]}</p>}
        </div>
        <TelefonoInput error={fe.clienteTelefono?.[0]} />
      </section>

      <section className="tarjeta space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">Cita</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="fecha">
              Fecha
            </label>
            <DatePicker id="fecha" name="fecha" value={fecha} onChange={setFecha} min={hoyCr()} />
            {fe.fecha && <p className="mt-1 text-sm text-red-600">{fe.fecha[0]}</p>}
          </div>
          <div>
            <label className="etiqueta" htmlFor="hora">
              Hora
            </label>
            <TimePicker id="hora" name="hora" value={hora} onChange={setHora} />
            {fe.hora && <p className="mt-1 text-sm text-red-600">{fe.hora[0]}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="servicio">
              Servicio (opcional)
            </label>
            <select
              id="servicio"
              name="servicio"
              className="campo"
              value={servicio}
              onChange={(e) => setServicio(e.target.value)}
            >
              <option value="">— Sin especificar —</option>
              {SERVICIOS.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="etiqueta" htmlFor="diasRecordatorio">
              Recordatorio (días antes)
            </label>
            <input
              id="diasRecordatorio"
              name="diasRecordatorio"
              type="number"
              min={0}
              max={30}
              defaultValue={diasRecordatorioDefault}
              className="campo"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="recordatorioMismoDia"
            defaultChecked={recordatorioMismoDiaDefault}
          />
          Enviar también un recordatorio el mismo día de la cita
        </label>

        <div>
          <label className="etiqueta" htmlFor="ubicacionUrl">
            Link de ubicación — Waze / Google Maps (opcional)
          </label>
          <input
            id="ubicacionUrl"
            name="ubicacionUrl"
            type="url"
            inputMode="url"
            placeholder="https://waze.com/ul/..."
            className="campo"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Uso interno: para que el equipo sepa a dónde ir. No se le envía al cliente.
          </p>
          {fe.ubicacionUrl && <p className="mt-1 text-sm text-red-600">{fe.ubicacionUrl[0]}</p>}
        </div>
      </section>

      <PreviewMensajes nombre={nombre} fecha={fecha} hora={hora} servicio={servicio || undefined} />

      <div className="flex items-center gap-3">
        <Enviar />
        <span className="text-xs text-zinc-400">
          Al guardar se envía de inmediato la confirmación por WhatsApp y correo.
        </span>
      </div>
    </form>
  );
}
