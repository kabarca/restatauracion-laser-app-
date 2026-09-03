import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import {
  notificarRecordatorio,
  notificarRecordatorioDia,
  notificarEncuesta,
} from "@/lib/notificaciones";
import { getAjustes } from "@/lib/ajustes";
import {
  debeEnviarRecordatorio,
  debeEnviarRecordatorioDia,
  debeEnviarEncuesta,
} from "@/lib/recordatorio-logica";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Job diario (Vercel Cron, 15:00 UTC = 9:00 a.m. Costa Rica). Hace 3 cosas:
 *  1. Recordatorio N días antes (una vez por cita).
 *  2. Recordatorio adicional el mismo día (si la cita lo tiene activado).
 *  3. Encuesta de satisfacción, X días después de la cita (si está habilitada).
 * Ver las reglas puras en src/lib/recordatorio-logica.ts.
 */
async function ejecutar() {
  const ahora = new Date();
  const ajustes = await getAjustes();
  const encuestaHabilitada = ajustes.encuestaHabilitada === "true";
  const encuestaDias = Math.max(0, parseInt(ajustes.encuestaDiasDespues ?? "1", 10) || 1);

  const errores: { id: string; tipo: string; error: string }[] = [];
  const hecho = { recordatorios: 0, recordatoriosDia: 0, encuestas: 0 };

  // ── 1 + 2: recordatorios (citas futuras y de hoy) ─────────────────────────
  const limite = new Date(ahora.getTime() + 32 * 24 * 60 * 60 * 1000);
  const proximas = await prisma.cita.findMany({
    where: {
      estado: { in: ["AGENDADA", "RECORDADA"] },
      canceladaEn: null,
      fechaHora: { gte: new Date(ahora.getTime() - 24 * 60 * 60 * 1000), lte: limite },
    },
  });

  for (const cita of proximas) {
    if (debeEnviarRecordatorio(cita, ahora)) {
      try {
        await notificarRecordatorio(cita.id);
        hecho.recordatorios++;
      } catch (e) {
        errores.push({ id: cita.id, tipo: "RECORDATORIO", error: msg(e) });
      }
    }
    if (debeEnviarRecordatorioDia(cita, ahora)) {
      try {
        await notificarRecordatorioDia(cita.id);
        hecho.recordatoriosDia++;
      } catch (e) {
        errores.push({ id: cita.id, tipo: "RECORDATORIO_DIA", error: msg(e) });
      }
    }
  }

  // ── 3: encuestas ──────────────────────────────────────────────────────────
  if (encuestaHabilitada) {
    const pasadas = await prisma.cita.findMany({
      where: {
        estado: { not: "CANCELADA" },
        canceladaEn: null,
        fechaHora: {
          lte: ahora,
          gte: new Date(ahora.getTime() - 31 * 24 * 60 * 60 * 1000),
        },
        encuesta: { is: null },
      },
    });
    for (const cita of pasadas) {
      if (!debeEnviarEncuesta({ ...cita, tieneEncuesta: false }, ahora, encuestaDias)) continue;
      try {
        await notificarEncuesta(cita.id);
        hecho.encuestas++;
      } catch (e) {
        errores.push({ id: cita.id, tipo: "ENCUESTA", error: msg(e) });
      }
    }
  }

  return { ...hecho, errores, revisadas: proximas.length };
}

function msg(e: unknown) {
  return e instanceof Error ? e.message : "desconocido";
}

function autorizado(req: NextRequest): boolean {
  if (!env.CRON_SECRET) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization");
  if (header === `Bearer ${env.CRON_SECRET}`) return true;
  return req.nextUrl.searchParams.get("secret") === env.CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const resultado = await ejecutar();
    return NextResponse.json({ ok: true, ...resultado });
  } catch (e) {
    console.error("Cron recordatorios falló:", e);
    return NextResponse.json({ ok: false, error: msg(e) }, { status: 500 });
  }
}

// Vercel Cron usa GET; POST disponible para disparo manual autenticado.
export const POST = GET;
