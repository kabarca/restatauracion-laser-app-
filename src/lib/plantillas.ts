import { env } from "@/lib/env";
import { formatFechaLarga, formatHora } from "@/lib/timezone";
import { nombreServicio } from "@/lib/servicios";

/**
 * Contenido de los mensajes. Los textos de WhatsApp deben coincidir con las
 * plantillas aprobadas en Meta (categoría Utility). Ver SETUP.md §Plantillas.
 */

export type DatosMensaje = {
  nombreCliente: string;
  fechaHora: Date;
  servicio?: string | null;
};

const contacto = () => env.WHATSAPP_CONTACTO_PUBLICO;

// ── WhatsApp: parámetros del BODY de la plantilla ────────────────────────────
// {{1}} = nombre · {{2}} = fecha larga · {{3}} = hora (ej. "2:30 p.m.")
// Plantilla "confirmacion_cita" (texto sugerido, ver SETUP.md):
//   Hola {{1}}, tu cita con Restauración Láser quedó agendada para el {{2}} a las {{3}}
//
//   Cualquier cambio, escribinos por este mismo WhatsApp. ¡Te esperamos!
// Plantilla "recordatorio_cita":
//   Hola {{1}}, te recordamos tu cita con Restauración Láser el {{2}} a las {{3}}
//
//   Si necesitás reprogramar, contactanos por acá. ¡Nos vemos pronto!
// (Sin punto tras {{3}} porque la hora ya termina en "m.").

export function whatsappParams(d: DatosMensaje): string[] {
  return [d.nombreCliente, formatFechaLarga(d.fechaHora), formatHora(d.fechaHora)];
}

// ── Email ───────────────────────────────────────────────────────────────────

function layout(titulo: string, cuerpoHtml: string): string {
  return `<!doctype html>
<html lang="es">
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr><td style="background:#0f172a;padding:20px 28px;">
          <span style="color:#ffffff;font-size:16px;font-weight:600;letter-spacing:0.02em;">Restauración Láser</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:18px;font-weight:600;">${titulo}</h1>
          ${cuerpoHtml}
        </td></tr>
        <tr><td style="padding:20px 28px;border-top:1px solid #e4e4e7;color:#71717a;font-size:12px;line-height:1.5;">
          Restauración Láser · Lindora, Santa Ana, San José, Costa Rica<br>
          Este mensaje se envió porque coordinaste una cita con nosotros.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function lineaServicio(servicio?: string | null): string {
  const n = nombreServicio(servicio);
  return n ? `<p style="margin:0 0 12px;">Servicio: <strong>${n}</strong></p>` : "";
}

export function emailConfirmacion(d: DatosMensaje) {
  const fecha = formatFechaLarga(d.fechaHora);
  const hora = formatHora(d.fechaHora);
  const subject = "Tu cita con Restauración Láser está confirmada";
  const text = `Hola ${d.nombreCliente},

Confirmamos tu cita con Restauración Láser para el ${fecha} a las ${hora}

Si necesitás modificar la fecha u hora, escribinos por WhatsApp al ${contacto()} y lo coordinamos.

Gracias por confiar en Restauración Láser.`;
  const html = layout(
    "Tu cita quedó confirmada",
    `<p style="margin:0 0 12px;">Hola ${d.nombreCliente},</p>
     <p style="margin:0 0 12px;">Confirmamos tu cita con Restauración Láser para el
       <strong>${fecha}</strong> a las <strong>${hora}</strong></p>
     ${lineaServicio(d.servicio)}
     <p style="margin:0 0 12px;">Si necesitás modificar la fecha u hora, escribinos por
       WhatsApp al <strong>${contacto()}</strong> y lo coordinamos.</p>
     <p style="margin:0;">Gracias por confiar en Restauración Láser.</p>`,
  );
  return { subject, text, html };
}

export function emailRecordatorio(d: DatosMensaje) {
  const fecha = formatFechaLarga(d.fechaHora);
  const hora = formatHora(d.fechaHora);
  const subject = `Recordatorio: tu cita con Restauración Láser es el ${fecha}`;
  const text = `Hola ${d.nombreCliente},

Te recordamos tu cita con Restauración Láser programada para el ${fecha} a las ${hora}

Si tenés alguna consulta antes de la cita o necesitás reprogramar, escribinos por WhatsApp al ${contacto()}.

Te esperamos.`;
  const html = layout(
    "Recordatorio de tu cita",
    `<p style="margin:0 0 12px;">Hola ${d.nombreCliente},</p>
     <p style="margin:0 0 12px;">Te recordamos tu cita con Restauración Láser programada para el
       <strong>${fecha}</strong> a las <strong>${hora}</strong></p>
     ${lineaServicio(d.servicio)}
     <p style="margin:0 0 12px;">Si tenés alguna consulta antes de la cita o necesitás
       reprogramar, escribinos por WhatsApp al <strong>${contacto()}</strong>.</p>
     <p style="margin:0;">Te esperamos.</p>`,
  );
  return { subject, text, html };
}

export function emailRecordatorioDia(d: DatosMensaje) {
  const hora = formatHora(d.fechaHora);
  const subject = "Hoy es tu cita con Restauración Láser";
  const text = `Hola ${d.nombreCliente},

Te recordamos que tu cita con Restauración Láser es hoy a las ${hora}

Si surgió algún inconveniente, escribinos por WhatsApp al ${contacto()}.

Te esperamos.`;
  const html = layout(
    "Hoy es tu cita",
    `<p style="margin:0 0 12px;">Hola ${d.nombreCliente},</p>
     <p style="margin:0 0 12px;">Te recordamos que tu cita con Restauración Láser es
       <strong>hoy a las ${hora}</strong></p>
     ${lineaServicio(d.servicio)}
     <p style="margin:0 0 12px;">Si surgió algún inconveniente, escribinos por WhatsApp al
       <strong>${contacto()}</strong>.</p>
     <p style="margin:0;">Te esperamos.</p>`,
  );
  return { subject, text, html };
}

export function emailEncuesta(d: DatosMensaje & { url: string }) {
  const subject = "¿Cómo te fue con Restauración Láser?";
  const text = `Hola ${d.nombreCliente},

Gracias por confiar en Restauración Láser. Nos ayudaría mucho saber cómo te fue: es 1 minuto.

Responder la encuesta: ${d.url}

¡Gracias!`;
  const html = layout(
    "¿Cómo te fue?",
    `<p style="margin:0 0 12px;">Hola ${d.nombreCliente},</p>
     <p style="margin:0 0 16px;">Gracias por confiar en Restauración Láser. Nos ayudaría
       mucho saber cómo te fue con el servicio — es 1 minuto.</p>
     <p style="margin:0 0 8px;">
       <a href="${d.url}" style="display:inline-block;background:#0f172a;color:#fff;
         text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">
         Responder la encuesta</a>
     </p>
     <p style="margin:12px 0 0;color:#71717a;font-size:12px;">Si el botón no funciona,
       copiá este enlace: ${d.url}</p>`,
  );
  return { subject, text, html };
}

export function emailReprogramacion(d: DatosMensaje) {
  const fecha = formatFechaLarga(d.fechaHora);
  const hora = formatHora(d.fechaHora);
  const subject = "Tu cita con Restauración Láser cambió de fecha";
  const text = `Hola ${d.nombreCliente},

Tu cita con Restauración Láser quedó reprogramada para el ${fecha} a las ${hora}

Si esta nueva fecha no te sirve, escribinos por WhatsApp al ${contacto()}.

Te esperamos.`;
  const html = layout(
    "Tu cita cambió de fecha",
    `<p style="margin:0 0 12px;">Hola ${d.nombreCliente},</p>
     <p style="margin:0 0 12px;">Tu cita con Restauración Láser quedó reprogramada para el
       <strong>${fecha}</strong> a las <strong>${hora}</strong></p>
     ${lineaServicio(d.servicio)}
     <p style="margin:0 0 12px;">Si esta nueva fecha no te sirve, escribinos por WhatsApp al
       <strong>${contacto()}</strong>.</p>
     <p style="margin:0;">Te esperamos.</p>`,
  );
  return { subject, text, html };
}

export function emailCancelacion(d: DatosMensaje & { motivo?: string | null }) {
  const fecha = formatFechaLarga(d.fechaHora);
  const subject = "Tu cita con Restauración Láser fue cancelada";
  const motivoTxt = d.motivo ? `\n\nMotivo: ${d.motivo}` : "";
  const text = `Hola ${d.nombreCliente},

Cancelamos tu cita con Restauración Láser que estaba para el ${fecha}.${motivoTxt}

Si querés reagendar, escribinos por WhatsApp al ${contacto()} y con gusto coordinamos una nueva fecha.`;
  const html = layout(
    "Tu cita fue cancelada",
    `<p style="margin:0 0 12px;">Hola ${d.nombreCliente},</p>
     <p style="margin:0 0 12px;">Cancelamos tu cita con Restauración Láser que estaba para el
       <strong>${fecha}</strong>.</p>
     ${d.motivo ? `<p style="margin:0 0 12px;">Motivo: ${d.motivo}</p>` : ""}
     <p style="margin:0;">Si querés reagendar, escribinos por WhatsApp al
       <strong>${contacto()}</strong> y coordinamos una nueva fecha.</p>`,
  );
  return { subject, text, html };
}

// ── Alerta interna al equipo cuando un envío falla ──────────────────────────
export function emailAlertaInterna(args: {
  citaId: string;
  cliente: string;
  canal: string;
  tipo: string;
  error: string;
}) {
  const url = `${env.NEXT_PUBLIC_APP_URL}/panel/citas/${args.citaId}`;
  const subject = `⚠️ Falló un envío (${args.tipo} / ${args.canal}) — ${args.cliente}`;
  const text = `No se pudo enviar el mensaje de ${args.tipo} por ${args.canal} al cliente ${args.cliente}.

Error: ${args.error}

Revisá la cita: ${url}`;
  const html = layout(
    "Falló un envío automático",
    `<p style="margin:0 0 12px;">No se pudo enviar el mensaje de <strong>${args.tipo}</strong>
       por <strong>${args.canal}</strong> al cliente <strong>${args.cliente}</strong>.</p>
     <p style="margin:0 0 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;color:#991b1b;font-family:monospace;font-size:13px;">${args.error}</p>
     <p style="margin:0;"><a href="${url}" style="color:#0f172a;">Abrir la cita en el panel →</a></p>`,
  );
  return { subject, text, html };
}

// ── Nueva solicitud de acceso (autorregistro en /registro) ─────────────────
export function emailNuevaSolicitud(args: { nombre: string; email: string; rol: string }) {
  const url = `${env.NEXT_PUBLIC_APP_URL}/panel/usuarios`;
  const rolTxt = args.rol === "ADMIN" ? "Administrador" : "Staff";
  const subject = `Nueva solicitud de acceso: ${args.nombre} (${rolTxt})`;
  const text = `${args.nombre} (${args.email}) pidió acceso al panel de Restauración Láser como ${rolTxt}.

Entrá a Equipo para aprobarlo o rechazarlo: ${url}`;
  const html = layout(
    "Nueva solicitud de acceso",
    `<p style="margin:0 0 12px;"><strong>${args.nombre}</strong> (${args.email}) pidió acceso al
       panel de Restauración Láser como <strong>${rolTxt}</strong>.</p>
     <p style="margin:0 0 16px;">Nadie entra sin que un administrador lo apruebe primero.</p>
     <p style="margin:0 0 8px;">
       <a href="${url}" style="display:inline-block;background:#0f172a;color:#fff;
         text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">
         Revisar en Equipo</a>
     </p>`,
  );
  return { subject, text, html };
}
