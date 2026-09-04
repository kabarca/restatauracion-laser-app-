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
// Plantilla base compartida por todos los correos: logo real de la marca,
// franja del color de marca, y una tarjeta blanca con sombra suave. El logo
// se sirve desde el propio sitio (${NEXT_PUBLIC_APP_URL}/logo-full.png), así
// que hace falta que esa variable apunte al dominio público en producción
// para que el logo se vea en la bandeja de entrada del cliente.

const MARCA = "#eb533c";
const logoUrl = () => `${env.NEXT_PUBLIC_APP_URL}/logo-full.png`;

function layout(titulo: string, cuerpoHtml: string): string {
  return `<!doctype html>
<html lang="es">
<head><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td style="height:4px;line-height:4px;font-size:0;background:${MARCA};">&nbsp;</td></tr>
        <tr><td style="padding:36px 40px 16px;text-align:center;">
          <img src="${logoUrl()}" width="150" alt="Restauración Láser"
               style="display:block;margin:0 auto;width:150px;max-width:55%;height:auto;border:0;outline:none;">
        </td></tr>
        <tr><td style="padding:12px 40px 8px;">
          <h1 style="margin:0 0 20px;font-size:21px;line-height:1.3;font-weight:800;color:#18181b;text-align:center;">${titulo}</h1>
          <div style="font-size:15px;line-height:1.65;color:#3f3f46;">
            ${cuerpoHtml}
          </div>
        </td></tr>
        <tr><td style="padding-top:16px;">&nbsp;</td></tr>
        <tr><td style="background:#fafaf9;padding:24px 40px;border-top:1px solid #e4e4e7;text-align:center;">
          <p style="margin:0;color:#71717a;font-size:12px;line-height:1.7;">
            <strong style="color:#52525b;">Restauración Láser</strong><br>
            Lindora, Santa Ana, San José, Costa Rica · WhatsApp ${contacto()}<br>
            Este mensaje se envió porque coordinaste una cita con nosotros.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function boton(href: string, texto: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px auto 0;">
    <tr><td style="border-radius:10px;background:${MARCA};">
      <a href="${href}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;
         color:#ffffff;text-decoration:none;border-radius:10px;">${texto}</a>
    </td></tr>
  </table>`;
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
     <p style="margin:0 0 24px;">Gracias por confiar en Restauración Láser. Nos ayudaría
       mucho saber cómo te fue con el servicio — es 1 minuto.</p>
     ${boton(d.url, "Responder la encuesta")}
     <p style="margin:24px 0 0;color:#a1a1aa;font-size:12px;text-align:center;">Si el botón no
       funciona, copiá este enlace:<br>${d.url}</p>`,
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
     <p style="margin:0 0 20px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 14px;color:#991b1b;font-family:ui-monospace,monospace;font-size:13px;">${args.error}</p>
     ${boton(url, "Abrir la cita en el panel")}`,
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
    `<p style="margin:0 0 8px;text-align:center;">
       <strong style="font-size:16px;">${args.nombre}</strong><br>
       <span style="color:#71717a;">${args.email}</span>
     </p>
     <p style="margin:0 0 24px;text-align:center;">
       Pidió acceso al panel como
       <span style="display:inline-block;padding:2px 10px;border-radius:999px;background:#fdece7;color:${MARCA};font-weight:700;font-size:13px;">${rolTxt}</span>
     </p>
     <p style="margin:0 0 24px;color:#71717a;text-align:center;">Nadie entra sin que un
       administrador lo apruebe primero.</p>
     ${boton(url, "Revisar en Equipo")}`,
  );
  return { subject, text, html };
}
