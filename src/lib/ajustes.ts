import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

/** Ajustes globales (tabla `ajustes`), con valores por defecto desde el entorno. */
export const AJUSTES_DEFAULT: Record<string, string> = {
  diasRecordatorioDefault: String(env.RECORDATORIO_DIAS_DEFAULT),
  recordatorioMismoDiaDefault: "false",
  whatsappContactoPublico: env.WHATSAPP_CONTACTO_PUBLICO,
  encuestaHabilitada: "false",
  encuestaDiasDespues: "1",
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
