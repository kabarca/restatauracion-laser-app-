import { utcToCrWall } from "@/lib/timezone";

/**
 * Reglas puras de "cuándo enviar". Se testean solas y las usa el cron.
 * Todas trabajan en calendario de Costa Rica.
 */

type CitaMinima = {
  fechaHora: Date;
  diasRecordatorio: number;
  recordatorioEnviadoEn: Date | null;
  recordatorioMismoDia: boolean;
  recordatorioDiaEnviadoEn: Date | null;
  canceladaEn: Date | null;
  estado: string;
};

const DIA_MS = 24 * 60 * 60 * 1000;

function fechaCrEnNDias(ahora: Date, n: number): string {
  return utcToCrWall(new Date(ahora.getTime() + n * DIA_MS)).fecha;
}

/** Recordatorio de N días antes: sale cuando la cita llegó a "hoy + N" o antes. */
export function debeEnviarRecordatorio(cita: CitaMinima, ahora: Date): boolean {
  if (cita.recordatorioEnviadoEn || cita.canceladaEn) return false;
  if (cita.estado === "CANCELADA" || cita.estado === "COMPLETADA") return false;
  if (cita.fechaHora.getTime() < ahora.getTime()) return false; // cita ya pasó
  const fechaCitaCr = utcToCrWall(cita.fechaHora).fecha;
  return fechaCitaCr <= fechaCrEnNDias(ahora, cita.diasRecordatorio);
}

/** Recordatorio adicional el mismo día de la cita. */
export function debeEnviarRecordatorioDia(cita: CitaMinima, ahora: Date): boolean {
  if (!cita.recordatorioMismoDia || cita.recordatorioDiaEnviadoEn || cita.canceladaEn) return false;
  if (cita.estado === "CANCELADA") return false;
  return utcToCrWall(cita.fechaHora).fecha === fechaCrEnNDias(ahora, 0);
}

/**
 * Encuesta post-servicio: cuando la fecha (CR) de la cita quedó al menos
 * `diasDespues` días atrás, y no hace más de 30 días. Una sola vez.
 */
export function debeEnviarEncuesta(
  cita: { fechaHora: Date; canceladaEn: Date | null; estado: string; tieneEncuesta: boolean },
  ahora: Date,
  diasDespues: number,
): boolean {
  if (cita.tieneEncuesta || cita.canceladaEn || cita.estado === "CANCELADA") return false;
  const fechaCitaCr = utcToCrWall(cita.fechaHora).fecha;
  return (
    fechaCitaCr <= fechaCrEnNDias(ahora, -diasDespues) &&
    fechaCitaCr >= fechaCrEnNDias(ahora, -30)
  );
}
