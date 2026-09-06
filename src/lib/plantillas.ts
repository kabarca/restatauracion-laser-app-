import { env } from "@/lib/env";
import { AJUSTES_DEFAULT } from "@/lib/ajustes";
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
// (Sin punto tras {{3}} porque la hora ya termina en "m.").
//
// Plantilla "recordatorio_cita": a diferencia de las demás, esta se edita desde
// Ajustes → admin (ver PLACEHOLDERS_RECORDATORIO más abajo), así que debe estar
// aprobada en Meta con UN SOLO parámetro {{1}} que reciba el mensaje completo
// ya armado — no con {{1}}/{{2}}/{{3}} por separado.

export function whatsappParams(d: DatosMensaje): string[] {
  return [d.nombreCliente, formatFechaLarga(d.fechaHora), formatHora(d.fechaHora)];
}

// ── Plantillas editables (Ajustes → admin) ──────────────────────────────────
// El recordatorio (correo y WhatsApp) se arma a partir de texto que el admin
// puede editar en Ajustes, con estos placeholders. Por eso, a diferencia de
// las demás plantillas de WhatsApp, "recordatorio_cita" debe estar aprobada en
// Meta con UN SOLO parámetro {{1}} que reciba el mensaje ya armado — no con
// {{1}}/{{2}}/{{3}} separados.
export const PLACEHOLDERS_RECORDATORIO = [
  { token: "{{nombre}}", desc: "nombre del cliente" },
  { token: "{{fecha}}", desc: "fecha de la cita" },
  { token: "{{hora}}", desc: "hora de la cita" },
  { token: "{{servicio}}", desc: "servicio (vacío si la cita no tiene uno)" },
  { token: "{{whatsapp}}", desc: "número de WhatsApp de contacto" },
] as const;

export function aplicarPlaceholders(tpl: string, d: DatosMensaje): string {
  return tpl
    .replaceAll("{{nombre}}", d.nombreCliente)
    .replaceAll("{{fecha}}", formatFechaLarga(d.fechaHora))
    .replaceAll("{{hora}}", formatHora(d.fechaHora))
    .replaceAll("{{servicio}}", nombreServicio(d.servicio) ?? "")
    .replaceAll("{{whatsapp}}", contacto());
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Texto plano (párrafos separados por línea en blanco) → párrafos <p> del correo. */
function textoAHtml(texto: string): string {
  return texto
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 12px;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// ── Email ───────────────────────────────────────────────────────────────────
// Plantilla base compartida por todos los correos: logo real de la marca,
// franja del color de marca, y una tarjeta blanca con sombra suave. El logo se
// carga desde una URL pública (env.EMAIL_LOGO_URL) — los clientes de correo no
// pueden resolver localhost ni URLs internas.

const MARCA = "#eb533c";
const logoUrl = () => env.EMAIL_LOGO_URL;

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

export function emailRecordatorio(d: DatosMensaje, plantilla?: { asunto: string; cuerpo: string }) {
  const subject = aplicarPlaceholders(
    plantilla?.asunto || AJUSTES_DEFAULT.emailRecordatorioAsunto,
    d,
  );
  const text = aplicarPlaceholders(plantilla?.cuerpo || AJUSTES_DEFAULT.emailRecordatorioCuerpo, d);
  const html = layout("Recordatorio de tu cita", textoAHtml(text));
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

// ── Invitación al equipo (un admin crea la cuenta desde Panel → Equipo) ─────
export function emailInvitacion(args: {
  nombre: string;
  rol: string;
  passwordTemporal: string;
}) {
  const url = `${env.NEXT_PUBLIC_APP_URL}/login`;
  const rolTxt = args.rol === "ADMIN" ? "Administrador" : "Staff";
  const subject = "Te invitaron al panel de Restauración Láser";
  const text = `Hola ${args.nombre},

Un administrador te creó una cuenta en el panel de recordatorios de Restauración Láser, con rol ${rolTxt}.

Correo: (el mismo al que te llegó este mensaje)
Contraseña temporal: ${args.passwordTemporal}

Entrá acá: ${url}

Por seguridad, el sistema te va a pedir que la cambiés apenas inicies sesión.`;
  const html = layout(
    "Te invitaron al equipo",
    `<p style="margin:0 0 12px;">Hola ${args.nombre},</p>
     <p style="margin:0 0 20px;">Un administrador te creó una cuenta en el panel de
       recordatorios de Restauración Láser, con rol
       <span style="display:inline-block;padding:2px 10px;border-radius:999px;background:#fdece7;color:${MARCA};font-weight:700;font-size:13px;">${rolTxt}</span>.
     </p>
     <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#fafaf9;border:1px solid #e4e4e7;border-radius:12px;margin:0 0 24px;">
       <tr><td style="padding:16px 20px;">
         <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:.03em;color:#a1a1aa;">Contraseña temporal</p>
         <p style="margin:0;font-family:ui-monospace,monospace;font-size:18px;font-weight:700;color:#18181b;letter-spacing:.02em;">${args.passwordTemporal}</p>
       </td></tr>
     </table>
     ${boton(url, "Entrar al panel")}
     <p style="margin:24px 0 0;color:#71717a;text-align:center;font-size:13px;">Por seguridad,
       el sistema te va a pedir que la cambiés apenas inicies sesión.</p>`,
  );
  return { subject, text, html };
}
