import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

/** Ajustes globales (tabla `ajustes`), con valores por defecto desde el entorno. */
export const AJUSTES_DEFAULT: Record<string, string> = {
  diasRecordatorioDefault: String(env.RECORDATORIO_DIAS_DEFAULT),
  recordatorioMismoDiaDefault: "false",
  whatsappContactoPublico: env.WHATSAPP_CONTACTO_PUBLICO,
  encuestaHabilitada: "false",
  encuestaDiasDespues: "1",
  emailRecordatorioAsunto: "Recordatorio: tu cita con Restauración Láser es el {{fecha}}",
  emailRecordatorioCuerpo:
    "Hola {{nombre}},\n\nTe recordamos tu cita con Restauración Láser programada para el {{fecha}} a las {{hora}}\n\nSi tenés alguna consulta antes de la cita o necesitás reprogramar, escribinos por WhatsApp al {{whatsapp}}.\n\nTe esperamos.",
  whatsappRecordatorioTexto:
    "Hola {{nombre}}, te recordamos tu cita con Restauración Láser el {{fecha}} a las {{hora}}\n\nSi necesitás reprogramar, contactanos por acá. ¡Nos vemos pronto!",
};

export async function getAjuste(clave: string): Promise<string> {
  const row = await prisma.ajuste.findUnique({ where: { clave } });
  return row?.valor ?? AJUSTES_DEFAULT[clave] ?? "";
}

export async function getAjustes(): Promise<Record<string, string>> {
  const rows = await prisma.ajuste.findMany();
  const map: Record<string, string> = { ...AJUSTES_DEFAULT };
  for (const r of rows) map[r.clave] = r.valor;
  return map;
}

export async function setAjuste(clave: string, valor: string): Promise<void> {
  await prisma.ajuste.upsert({
    where: { clave },
    create: { clave, valor },
    update: { valor },
  });
}
