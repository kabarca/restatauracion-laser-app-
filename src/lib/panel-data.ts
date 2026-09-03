import { prisma } from "@/lib/prisma";
import { rangoDiaCrUtc, utcToCrWall } from "@/lib/timezone";

/** Encuestas enviadas + respondidas, con promedio de puntaje. */
export async function resumenEncuestas() {
  const [enviadas, respondidas, agg, ultimas] = await Promise.all([
    prisma.encuesta.count(),
    prisma.encuesta.count({ where: { respondidaEn: { not: null } } }),
    prisma.encuesta.aggregate({ _avg: { puntaje: true }, where: { puntaje: { not: null } } }),
    prisma.encuesta.findMany({
      where: { respondidaEn: { not: null } },
      include: { cita: { include: { cliente: true } } },
      orderBy: { respondidaEn: "desc" },
      take: 50,
    }),
  ]);
  return {
    enviadas,
    respondidas,
    promedio: agg._avg.puntaje,
    tasaRespuesta: enviadas > 0 ? respondidas / enviadas : 0,
    ultimas,
  };
}

/** Datos agregados para el tablero de inicio del panel. */
export async function resumenTablero() {
  const ahora = new Date();
  const hoy = rangoDiaCrUtc(0, ahora);
  const fin7 = rangoDiaCrUtc(7, ahora).fin;

  const [citasHoy, proximas, sinRecordatorio, fallidos, porEstado] = await Promise.all([
    prisma.cita.findMany({
      where: {
        fechaHora: { gte: hoy.inicio, lt: hoy.fin },
        estado: { not: "CANCELADA" },
      },
      include: { cliente: true },
      orderBy: { fechaHora: "asc" },
    }),
    prisma.cita.findMany({
      where: {
        fechaHora: { gte: hoy.fin, lt: fin7 },
        estado: { not: "CANCELADA" },
      },
      include: { cliente: true },
      orderBy: { fechaHora: "asc" },
    }),
    // Candidatas a recordatorio: futuras, sin recordatorio, no canceladas.
    prisma.cita.findMany({
      where: {
        estado: { in: ["AGENDADA", "RECORDADA"] },
        recordatorioEnviadoEn: null,
        canceladaEn: null,
        fechaHora: { gte: ahora },
      },
      include: { cliente: true },
      orderBy: { fechaHora: "asc" },
    }),
    prisma.mensajeLog.findMany({
      where: {
        estado: "FALLIDO",
        enviadoEn: { gte: new Date(ahora.getTime() - 14 * 24 * 60 * 60 * 1000) },
      },
      include: { cita: { include: { cliente: true } } },
      orderBy: { enviadoEn: "desc" },
      take: 20,
    }),
    prisma.cita.groupBy({ by: ["estado"], _count: { _all: true } }),
  ]);

  // "El recordatorio debía salir hoy o antes" = fecha de la cita (CR) está a
  // <= diasRecordatorio días de hoy.
  const fechaCrEnNDias = (n: number) =>
    utcToCrWall(new Date(ahora.getTime() + n * 24 * 60 * 60 * 1000)).fecha;

  // El cron envía cuando fechaCita(CR) == hoy + diasRecordatorio.
  //  - pendiente: fechaCita <= hoy + diasRecordatorio (sale hoy o ya debía salir)
  //  - atrasado:  fechaCita <  hoy + diasRecordatorio (el cron debió enviarlo antes)
  const recordatoriosPendientes = sinRecordatorio.filter(
    (c) => utcToCrWall(c.fechaHora).fecha <= fechaCrEnNDias(c.diasRecordatorio),
  );
  const recordatoriosAtrasados = recordatoriosPendientes.filter(
    (c) => utcToCrWall(c.fechaHora).fecha < fechaCrEnNDias(c.diasRecordatorio),
  );

  const conteo = (estado: string) =>
    porEstado.find((p) => p.estado === estado)?._count._all ?? 0;

  return {
    citasHoy,
    proximas,
    recordatoriosPendientes,
    recordatoriosAtrasados,
    fallidos,
    totales: {
      agendadas: conteo("AGENDADA"),
      recordadas: conteo("RECORDADA"),
      completadas: conteo("COMPLETADA"),
      canceladas: conteo("CANCELADA"),
    },
  };
}
