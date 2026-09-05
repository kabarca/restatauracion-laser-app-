import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { getAjustes } from "@/lib/ajustes";
import { enviarPlantillaWhatsapp, type ResultadoEnvio } from "@/lib/whatsapp";
import { enviarEmail } from "@/lib/email";
import {
  whatsappParams,
  aplicarPlaceholders,
  emailConfirmacion,
  emailRecordatorio,
  emailRecordatorioDia,
  emailReprogramacion,
  emailCancelacion,
  emailEncuesta,
  emailAlertaInterna,
} from "@/lib/plantillas";
import { Prisma, type Canal, type TipoMensaje, type Cita, type Cliente } from "@/generated/prisma";

type CitaConCliente = Cita & { cliente: Cliente };

const PLANTILLA_WA: Partial<Record<TipoMensaje, string>> = {
  CONFIRMACION: env.WHATSAPP_TEMPLATE_CONFIRMACION,
  RECORDATORIO: env.WHATSAPP_TEMPLATE_RECORDATORIO,
  RECORDATORIO_DIA: env.WHATSAPP_TEMPLATE_RECORDATORIO,
};

function datosDe(cita: CitaConCliente) {
  return {
    nombreCliente: cita.cliente.nombre,
    fechaHora: cita.fechaHora,
    servicio: cita.servicio,
  };
}

async function urlEncuesta(citaId: string): Promise<string> {
  const enc = await prisma.encuesta.upsert({
    where: { citaId },
    create: { citaId },
    update: {},
  });
  return `${env.NEXT_PUBLIC_APP_URL}/encuesta/${enc.token}`;
}

async function construirEmail(tipo: TipoMensaje, cita: CitaConCliente) {
  const d = datosDe(cita);
  switch (tipo) {
    case "CONFIRMACION":
      return emailConfirmacion(d);
    case "RECORDATORIO": {
      const a = await getAjustes();
      return emailRecordatorio(d, { asunto: a.emailRecordatorioAsunto, cuerpo: a.emailRecordatorioCuerpo });
    }
    case "RECORDATORIO_DIA":
      return emailRecordatorioDia(d);
    case "REPROGRAMACION":
      return emailReprogramacion(d);
    case "CANCELACION":
      return emailCancelacion({ ...d, motivo: cita.motivoCancelacion });
    case "ENCUESTA":
      return emailEncuesta({ ...d, url: await urlEncuesta(cita.id) });
  }
}

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
      intentos: r.intentos ?? 1,
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

/** Cuerpo de la plantilla de WhatsApp según el tipo — RECORDATORIO usa el texto
 * editable en Ajustes (un solo parámetro con el mensaje ya armado). */
async function bodyParamsPara(tipo: TipoMensaje, cita: CitaConCliente): Promise<string[]> {
  if (tipo === "RECORDATORIO") {
    const a = await getAjustes();
    return [aplicarPlaceholders(a.whatsappRecordatorioTexto, datosDe(cita))];
  }
  return whatsappParams(datosDe(cita));
}

/** Envía WhatsApp (si el tipo tiene plantilla) + email, y registra ambos. */
async function enviarPar(cita: CitaConCliente, tipo: TipoMensaje) {
  const plantilla = PLANTILLA_WA[tipo];
  if (plantilla) {
    const wa = await enviarPlantillaWhatsapp({
      to: cita.cliente.telefono,
      template: plantilla,
      locale: env.WHATSAPP_TEMPLATE_LOCALE,
      bodyParams: await bodyParamsPara(tipo, cita),
    });
    await registrar(cita.id, "WHATSAPP", tipo, cita.cliente.telefono, wa);
    if (wa.estado === "FALLIDO") await alertarEquipo(cita, "WHATSAPP", tipo, wa.error ?? "?");
  }

  const email = await construirEmail(tipo, cita);
  const em = await enviarEmail({
    to: cita.cliente.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  await registrar(cita.id, "EMAIL", tipo, cita.cliente.email, em);
  if (em.estado === "FALLIDO") await alertarEquipo(cita, "EMAIL", tipo, em.error ?? "?");
}

async function cargarCita(citaId: string): Promise<CitaConCliente> {
  return prisma.cita.findUniqueOrThrow({ where: { id: citaId }, include: { cliente: true } });
}

export async function notificarConfirmacion(citaId: string) {
  const cita = await cargarCita(citaId);
  await enviarPar(cita, "CONFIRMACION");
  await prisma.cita.update({ where: { id: citaId }, data: { confirmacionEnviadaEn: new Date() } });
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

export async function notificarRecordatorioDia(citaId: string) {
  const cita = await cargarCita(citaId);
  await enviarPar(cita, "RECORDATORIO_DIA");
  await prisma.cita.update({
    where: { id: citaId },
    data: { recordatorioDiaEnviadoEn: new Date() },
  });
}

export async function notificarEncuesta(citaId: string) {
  const cita = await cargarCita(citaId);
  const { subject, html, text } = emailEncuesta({
    ...datosDe(cita),
    url: await urlEncuesta(cita.id),
  });
  const em = await enviarEmail({ to: cita.cliente.email, subject, html, text });
  await registrar(cita.id, "EMAIL", "ENCUESTA", cita.cliente.email, em);
  await prisma.encuesta.update({ where: { citaId }, data: { enviadaEn: new Date() } });
  if (em.estado === "FALLIDO") await alertarEquipo(cita, "EMAIL", "ENCUESTA", em.error ?? "?");
}

export async function notificarReprogramacion(citaId: string) {
  await enviarPar(await cargarCita(citaId), "REPROGRAMACION");
}

export async function notificarCancelacion(citaId: string) {
  await enviarPar(await cargarCita(citaId), "CANCELACION");
}

/**
 * Reintenta los mensajes cuyo ÚLTIMO registro (por cita+canal+tipo) quedó
 * FALLIDO en los últimos `dias` días.
 */
export async function reintentarTodosLosFallidos(dias = 14) {
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  const logs = await prisma.mensajeLog.findMany({
    where: { enviadoEn: { gte: desde } },
    orderBy: { enviadoEn: "desc" },
  });

  const vistos = new Set<string>();
  const aReintentar: string[] = [];
  for (const l of logs) {
    const clave = `${l.citaId}|${l.canal}|${l.tipo}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    if (l.estado === "FALLIDO") aReintentar.push(l.id);
  }

  let ok = 0;
  let fallidos = 0;
  for (const id of aReintentar) {
    try {
      const estado = await reintentarMensaje(id);
      if (estado === "FALLIDO") fallidos++;
      else ok++;
    } catch {
      fallidos++;
    }
  }
  return { intentados: aReintentar.length, ok, fallidos };
}

/** Reintenta un envío que quedó FALLIDO, reusando el mismo tipo/canal. */
export async function reintentarMensaje(mensajeLogId: string) {
  const log = await prisma.mensajeLog.findUniqueOrThrow({ where: { id: mensajeLogId } });
  const cita = await cargarCita(log.citaId);

  let r: ResultadoEnvio;
  if (log.canal === "WHATSAPP") {
    const plantilla = PLANTILLA_WA[log.tipo];
    if (!plantilla) throw new Error(`El tipo ${log.tipo} no tiene plantilla de WhatsApp.`);
    r = await enviarPlantillaWhatsapp({
      to: cita.cliente.telefono,
      template: plantilla,
      locale: env.WHATSAPP_TEMPLATE_LOCALE,
      bodyParams: await bodyParamsPara(log.tipo, cita),
    });
  } else {
    const email = await construirEmail(log.tipo, cita);
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
