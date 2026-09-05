/**
 * Costa Rica es UTC-6 todo el año (no tiene horario de verano), así que la
 * conversión hora-local ⇄ UTC es un offset fijo. Para *mostrar* fechas usamos
 * Intl con timeZone "America/Costa_Rica" (Node trae ICU completo).
 */
export const CR_TZ = "America/Costa_Rica";
const CR_OFFSET_MS = 6 * 60 * 60 * 1000; // UTC = CR + 6h

/** "2025-09-08" + "14:30" (hora de pared en Costa Rica) → Date en UTC. */
export function crWallToUtc(fecha: string, hora: string): Date {
  const mF = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  const mH = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!mF || !mH) throw new Error(`Fecha u hora inválida: "${fecha}" "${hora}"`);
  const [, ys, ms, ds] = mF;
  const [, hhs, mms] = mH;
  const y = +ys;
  const m = +ms;
  const d = +ds;
  const hh = +hhs;
  const mm = +mms;
  if (m < 1 || m > 12 || d < 1 || d > 31 || hh > 23 || mm > 59) {
    throw new Error(`Fecha u hora fuera de rango: "${fecha}" "${hora}"`);
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

// ── Vista de calendario (mes) ────────────────────────────────────────────────
// Estas funciones trabajan con "YYYY-MM" / "YYYY-MM-DD" como fechas de
// calendario puras (sin hora) — no hace falta pasar por el offset de CR
// porque solo arman la grilla; el bucketing real usa utcToCrWall.

/** "YYYY-MM" del mes actual en Costa Rica. */
export function mesActualCr(ahora = new Date()): string {
  return utcToCrWall(ahora).fecha.slice(0, 7);
}

/** "YYYY-MM-DD" de hoy en Costa Rica. */
export function hoyCr(ahora = new Date()): string {
  return utcToCrWall(ahora).fecha;
}

/** "2026-09" + delta meses → "2026-08" / "2026-10" / etc. */
export function mesRelativo(mes: string, delta: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** "Septiembre de 2026" a partir de "2026-09". */
export function formatMesLargo(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  const texto = new Intl.DateTimeFormat("es-CR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Grilla de semanas (lunes a domingo) que cubre el mes "YYYY-MM", con los
 * días del mes anterior/siguiente necesarios para completar semanas. Recorta
 * la última fila si es enteramente del mes siguiente.
 */
export function grillaMes(mes: string, ahora = new Date()): { fecha: string; enMes: boolean; hoy: boolean }[] {
  const [y, m] = mes.split("-").map(Number);
  const primerDia = new Date(Date.UTC(y, m - 1, 1));
  const diaSemana = (primerDia.getUTCDay() + 6) % 7; // lunes=0 … domingo=6
  const inicio = new Date(Date.UTC(y, m - 1, 1 - diaSemana));
  const hoyStr = utcToCrWall(ahora).fecha;

  const dias: { fecha: string; enMes: boolean; hoy: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(inicio.getTime() + i * 86400000);
    const fecha = d.toISOString().slice(0, 10);
    dias.push({ fecha, enMes: d.getUTCMonth() === m - 1, hoy: fecha === hoyStr });
  }
  // Si la última semana completa es enteramente del mes siguiente, se recorta.
  if (dias.slice(35, 42).every((d) => !d.enMes)) dias.length = 35;
  return dias;
}
