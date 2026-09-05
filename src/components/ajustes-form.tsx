"use client";

import { useActionState, useState } from "react";
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

const MUESTRA = {
  nombre: "María Fernández",
  fecha: "lunes 8 de septiembre de 2026",
  hora: "2:30 p.m.",
  servicio: "Depilación láser - piernas",
};

function conMuestra(tpl: string, contactoPublico: string): string {
  return tpl
    .replaceAll("{{nombre}}", MUESTRA.nombre)
    .replaceAll("{{fecha}}", MUESTRA.fecha)
    .replaceAll("{{hora}}", MUESTRA.hora)
    .replaceAll("{{servicio}}", MUESTRA.servicio)
    .replaceAll("{{whatsapp}}", contactoPublico);
}

const PLACEHOLDERS = ["{{nombre}}", "{{fecha}}", "{{hora}}", "{{servicio}}", "{{whatsapp}}"];

export function AjustesForm({
  diasRecordatorioDefault,
  recordatorioMismoDiaDefault,
  encuestaHabilitada,
  encuestaDiasDespues,
  emailRecordatorioAsunto,
  emailRecordatorioCuerpo,
  whatsappRecordatorioTexto,
  contactoPublico,
}: {
  diasRecordatorioDefault: number;
  recordatorioMismoDiaDefault: boolean;
  encuestaHabilitada: boolean;
  encuestaDiasDespues: number;
  emailRecordatorioAsunto: string;
  emailRecordatorioCuerpo: string;
  whatsappRecordatorioTexto: string;
  contactoPublico: string;
}) {
  const [state, action] = useActionState(guardarAjustes, { ok: false });
  const [asunto, setAsunto] = useState(emailRecordatorioAsunto);
  const [cuerpo, setCuerpo] = useState(emailRecordatorioCuerpo);
  const [waTexto, setWaTexto] = useState(whatsappRecordatorioTexto);
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

      <div className="border-t border-zinc-200 pt-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Textos del recordatorio</h2>
          <p className="text-xs text-zinc-400">
            Se usan cuando se envía el recordatorio (días antes de la cita). Placeholders
            disponibles: {PLACEHOLDERS.map((p) => (
              <code key={p} className="mx-0.5 rounded bg-zinc-100 px-1 py-0.5 text-zinc-600">
                {p}
              </code>
            ))}
          </p>
        </div>

        <div>
          <label className="etiqueta" htmlFor="emailRecordatorioAsunto">
            Asunto del correo
          </label>
          <input
            id="emailRecordatorioAsunto"
            name="emailRecordatorioAsunto"
            className="campo"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            maxLength={2000}
          />
        </div>

        <div>
          <label className="etiqueta" htmlFor="emailRecordatorioCuerpo">
            Cuerpo del correo
          </label>
          <textarea
            id="emailRecordatorioCuerpo"
            name="emailRecordatorioCuerpo"
            rows={6}
            className="campo"
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            maxLength={2000}
          />
          <p className="mt-1 text-xs text-zinc-400">
            Los párrafos separados por una línea en blanco se muestran como párrafos aparte en
            el correo.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
          <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
            Vista previa del correo
          </p>
          <p className="font-medium text-zinc-800">{conMuestra(asunto, contactoPublico)}</p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-600">
            {conMuestra(cuerpo, contactoPublico)}
          </p>
        </div>

        <div>
          <label className="etiqueta" htmlFor="whatsappRecordatorioTexto">
            Mensaje de WhatsApp
          </label>
          <textarea
            id="whatsappRecordatorioTexto"
            name="whatsappRecordatorioTexto"
            rows={4}
            className="campo"
            value={waTexto}
            onChange={(e) => setWaTexto(e.target.value)}
            maxLength={2000}
          />
          <p className="mt-1 text-xs text-zinc-400">
            Importante: la plantilla de WhatsApp aprobada en Meta (&quot;recordatorio_cita&quot;)
            debe tener un solo parámetro que reciba este mensaje completo — si se edita mucho
            el texto y cambia la plantilla en Meta, puede que haga falta pedir la reaprobación.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
          <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
            Vista previa de WhatsApp
          </p>
          <p className="whitespace-pre-wrap text-zinc-600">{conMuestra(waTexto, contactoPublico)}</p>
        </div>
      </div>

      {state.ok && <p className="text-sm text-emerald-600">Ajustes guardados.</p>}
      <Enviar />
    </form>
  );
}
