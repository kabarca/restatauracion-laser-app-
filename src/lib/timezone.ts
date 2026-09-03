/**
 * Costa Rica es UTC-6 todo el año (no tiene horario de verano), así que la
 * conversión hora-local ⇄ UTC es un offset fijo. Para *mostrar* fechas usamos
 * Intl con timeZone "America/Costa_Rica" (Node trae ICU completo).
 */
export const CR_TZ = "America/Costa_Rica";
const CR_OFFSET_MS = 6 * 60 * 60 * 1000; // UTC = CR + 6h

/** "2025-09-08" + "14:30" (hora de pared en Costa Rica) → Date en UTC. */
export function crWallToUtc(fecha: string, hora: string): Date {
  const [y, m, d] = fecha.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) {
    throw new Error(`Fecha u hora inválida: "${fecha}" "${hora}"`);
  }
  return new Date(Date.UTC(y, m - 1, d, hh, mm) + CR_OFFSET_MS);
}

/** Date (UTC) → { fecha: "2025-09-08", hora: "14:30" } en hora de Costa Rica. */
export function utcToCrWall(date: Date): { fecha: string; hora: string } {
  const shifted = new Date(date.getTime() - CR_OFFSET_MS);
  const fecha = shifted.toISOString().slice(0, 10);
  const hora = shifted.toISOString().slice(11, 16);
  return { fecha, hora };
}

const fechaLargaFmt = new Intl.DateTimeFormat("es-CR", {
  timeZone: CR_TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const fechaCortaFmt = new Intl.DateTimeFormat("es-CR", {
  timeZone: CR_TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const horaFmt = new Intl.DateTimeFormat("es-CR", {
  timeZone: CR_TZ,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "lunes 8 de septiembre de 2025" */
export function formatFechaLarga(date: Date): string {
  // es-CR intercala una coma tras el día de la semana; la quitamos para el mensaje.
  return fechaLargaFmt.format(date).replace(/^(\S+),\s/, "$1 ");
}

/** "08/09/2025" */
export function formatFechaCorta(date: Date): string {
  return fechaCortaFmt.format(date);
}

/** "2:30 p.m." (se compacta "p. m." → "p.m." para que cierre bien las frases). */
export function formatHora(date: Date): string {
  return horaFmt
    .format(date)
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\ba\.?\s?m\.?$/i, "a.m.")
    .replace(/\bp\.?\s?m\.?$/i, "p.m.");
}

/** "lunes 8 de septiembre de 2025 a las 2:30 p. m." */
export function formatFechaHora(date: Date): string {
  return `${formatFechaLarga(date)} a las ${formatHora(date)}`;
}

/**
 * Rango [inicio, fin) en UTC que cubre TODO un día de calendario de Costa Rica,
 * `diasDesdeHoy` días después de hoy. Se usa en el cron de recordatorios.
 */
export function rangoDiaCrUtc(diasDesdeHoy: number, ahora = new Date()): { inicio: Date; fin: Date } {
  const hoyCr = new Date(ahora.getTime() - CR_OFFSET_MS);
  const y = hoyCr.getUTCFullYear();
  const m = hoyCr.getUTCMonth();
  const d = hoyCr.getUTCDate() + diasDesdeHoy;
  const inicio = new Date(Date.UTC(y, m, d, 0, 0, 0) + CR_OFFSET_MS);
  const fin = new Date(Date.UTC(y, m, d + 1, 0, 0, 0) + CR_OFFSET_MS);
  return { inicio, fin };
}
