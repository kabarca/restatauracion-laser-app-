"use client";

import { crWallToUtc, formatFechaLarga, formatHora } from "@/lib/timezone";
import { nombreServicio } from "@/lib/servicios";

/**
 * Previsualización de lo que recibirá el cliente al guardar la cita.
 * Los textos deben coincidir con las plantillas aprobadas en Meta y con
 * src/lib/plantillas.ts. Es solo una vista previa — el envío real lo arma el servidor.
 */
export function PreviewMensajes({
  nombre,
  fecha,
  hora,
  servicio,
}: {
  nombre: string;
  fecha: string;
  hora: string;
  servicio?: string;
}) {
  const nombreMostrar = nombre.trim() || "[nombre]";
  let fechaTxt = "[fecha]";
  let horaTxt = "[hora]";
  try {
    if (fecha && hora) {
      const d = crWallToUtc(fecha, hora);
      fechaTxt = formatFechaLarga(d);
      horaTxt = formatHora(d);
    }
  } catch {
    /* fecha/hora incompletas */
  }

  const wa = `Hola ${nombreMostrar}, tu cita con Restauración Láser quedó agendada para el ${fechaTxt} a las ${horaTxt}\n\nCualquier cambio, escribinos por este mismo WhatsApp. ¡Te esperamos!`;
  const servicioLinea = servicio ? `\nServicio: ${nombreServicio(servicio)}` : "";
  const emailTxt = `Asunto: Tu cita con Restauración Láser está confirmada\n\nHola ${nombreMostrar},\n\nConfirmamos tu cita con Restauración Láser para el ${fechaTxt} a las ${horaTxt}${servicioLinea}\n\nSi necesitás modificar la fecha u hora, escribinos por WhatsApp y lo coordinamos.\n\nGracias por confiar en Restauración Láser.`;

  return (
    <section className="tarjeta space-y-3 bg-zinc-50">
      <h2 className="text-sm font-semibold text-zinc-900">Vista previa del mensaje</h2>
      <div>
        <div className="mb-1 text-xs font-medium uppercase text-zinc-500">WhatsApp</div>
        <p className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
          {wa}
        </p>
      </div>
      <div>
        <div className="mb-1 text-xs font-medium uppercase text-zinc-500">Correo</div>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white p-3 font-sans text-sm text-zinc-700">
          {emailTxt}
        </pre>
      </div>
      <p className="text-xs text-zinc-400">
        El recordatorio se enviará automáticamente los días antes que definas. La vista
        previa es de referencia; el texto exacto de WhatsApp depende de la plantilla
        aprobada en Meta.
      </p>
    </section>
  );
}
