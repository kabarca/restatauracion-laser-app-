import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { enviarPlantillaWhatsapp, type ResultadoEnvio } from "@/lib/whatsapp";
import { enviarEmail } from "@/lib/email";
import {
  whatsappParams,
  emailConfirmacion,
  emailRecordatorio,
  emailReprogramacion,
  emailCancelacion,
  emailAlertaInterna,
} from "@/lib/plantillas";
import { Prisma, type Canal, type TipoMensaje, type Cita, type Cliente } from "@/generated/prisma";

type CitaConCliente = Cita & { cliente: Cliente };

const PLANTILLA_WA: Partial<Record<TipoMensaje, string>> = {
  CONFIRMACION: env.WHATSAPP_TEMPLATE_CONFIRMACION,
  RECORDATORIO: env.WHATSAPP_TEMPLATE_RECORDATORIO,
};

async function registrar(
  citaId: string,
  canal: Canal,
  tipo: TipoMensaje,
  destino: string,
  r: ResultadoEnvio,
) {
  await prisma.mensajeLog.create({
    data: {
      citaId,
      canal,
      tipo,
      destino,
      estado: r.estado,
      proveedorId: r.proveedorId,
      error: r.error,
      payload: (r.payload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });
}

async function alertarEquipo(cita: CitaConCliente, canal: Canal, tipo: TipoMensaje, error: string) {
  if (!env.EMAIL_EQUIPO) return;
  const { subject, html, text } = emailAlertaInterna({
    citaId: cita.id,
    cliente: cita.cliente.nombre,
    canal,
    tipo,
    error,
  });
  await enviarEmail({ to: env.EMAIL_EQUIPO, subject, html, text });
}

/** Envía WhatsApp + email de un tipo dado y registra ambos en MensajeLog. */
async function enviarPar(cita: CitaConCliente, tipo: TipoMensaje) {
  const datos = {
    nombreCliente: cita.cliente.nombre,
    fechaHora: cita.fechaHora,
    servicio: cita.servicio,
  };

  // WhatsApp (solo para tipos con plantilla aprobada: confirmación y recordatorio).
  const plantilla = PLANTILLA_WA[tipo];
  if (plantilla) {
    const wa = await enviarPlantillaWhatsapp({
      to: cita.cliente.telefono,
      template: plantilla,
      locale: env.WHATSAPP_TEMPLATE_LOCALE,
      bodyParams: whatsappParams(datos),
    });
    await registrar(cita.id, "WHATSAPP", tipo, cita.cliente.telefono, wa);
    if (wa.estado === "FALLIDO") {
      await alertarEquipo(cita, "WHATSAPP", tipo, wa.error ?? "desconocido");
    }
  }

  // Email
  const email =
    tipo === "CONFIRMACION"
      ? emailConfirmacion(datos)
      : tipo === "RECORDATORIO"
        ? emailRecordatorio(datos)
        : tipo === "REPROGRAMACION"
          ? emailReprogramacion(datos)
          : emailCancelacion({ ...datos, motivo: cita.motivoCancelacion });

  const em = await enviarEmail({
    to: cita.cliente.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  await registrar(cita.id, "EMAIL", tipo, cita.cliente.email, em);
  if (em.estado === "FALLIDO") {
    await alertarEquipo(cita, "EMAIL", tipo, em.error ?? "desconocido");
  }
}

async function cargarCita(citaId: string): Promise<CitaConCliente> {
  const cita = await prisma.cita.findUniqueOrThrow({
    where: { id: citaId },
    include: { cliente: true },
  });
  return cita;
}

export async function notificarConfirmacion(citaId: string) {
  const cita = await cargarCita(citaId);
  await enviarPar(cita, "CONFIRMACION");
  await prisma.cita.update({
    where: { id: citaId },
    data: { confirmacionEnviadaEn: new Date() },
  });
}

export async function notificarRecordatorio(citaId: string) {
  const cita = await cargarCita(citaId);
  await enviarPar(cita, "RECORDATORIO");
  await prisma.cita.update({
    where: { id: citaId },
    data: {
      recordatorioEnviadoEn: new Date(),
      estado: cita.estado === "AGENDADA" ? "RECORDADA" : cita.estado,
    },
  });
}

export async function notificarReprogramacion(citaId: string) {
  const cita = await cargarCita(citaId);
  await enviarPar(cita, "REPROGRAMACION");
}

export async function notificarCancelacion(citaId: string) {
  const cita = await cargarCita(citaId);
  await enviarPar(cita, "CANCELACION");
}

/** Reintenta un envío que quedó FALLIDO, reusando el mismo tipo/canal. */
export async function reintentarMensaje(mensajeLogId: string) {
  const log = await prisma.mensajeLog.findUniqueOrThrow({ where: { id: mensajeLogId } });
  const cita = await cargarCita(log.citaId);
  const datos = {
    nombreCliente: cita.cliente.nombre,
    fechaHora: cita.fechaHora,
    servicio: cita.servicio,
  };

  let r: ResultadoEnvio;
  if (log.canal === "WHATSAPP") {
    const plantilla = PLANTILLA_WA[log.tipo];
    if (!plantilla) throw new Error(`El tipo ${log.tipo} no tiene plantilla de WhatsApp.`);
    r = await enviarPlantillaWhatsapp({
      to: cita.cliente.telefono,
      template: plantilla,
      locale: env.WHATSAPP_TEMPLATE_LOCALE,
      bodyParams: whatsappParams(datos),
    });
  } else {
    const email =
      log.tipo === "CONFIRMACION"
        ? emailConfirmacion(datos)
        : log.tipo === "RECORDATORIO"
          ? emailRecordatorio(datos)
          : log.tipo === "REPROGRAMACION"
            ? emailReprogramacion(datos)
            : emailCancelacion({ ...datos, motivo: cita.motivoCancelacion });
    r = await enviarEmail({
      to: cita.cliente.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  }
  await registrar(cita.id, log.canal, log.tipo, log.destino, r);
  return r.estado;
}
