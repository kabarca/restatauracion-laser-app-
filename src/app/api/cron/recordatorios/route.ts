import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { utcToCrWall } from "@/lib/timezone";
import { notificarRecordatorio } from "@/lib/notificaciones";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Job diario (Vercel Cron, 15:00 UTC = 9:00 a.m. Costa Rica).
 * Busca citas cuya fecha caiga exactamente a `diasRecordatorio` días de hoy
 * (en calendario de Costa Rica) y que todavía no tengan recordatorio enviado.
 */
async function ejecutar() {
  const ahora = new Date();

  // Candidatas: agendadas, sin recordatorio, en los próximos ~31 días.
  const limite = new Date(ahora.getTime() + 32 * 24 * 60 * 60 * 1000);
  const candidatas = await prisma.cita.findMany({
    where: {
      estado: { in: ["AGENDADA", "RECORDADA"] },
      recordatorioEnviadoEn: null,
      canceladaEn: null,
      fechaHora: { gte: ahora, lte: limite },
    },
    include: { cliente: true },
  });

  // "YYYY-MM-DD" en Costa Rica para (hoy + n).
  const fechaCrEnNDias = (n: number) => {
    const d = new Date(ahora.getTime() + n * 24 * 60 * 60 * 1000);
    return utcToCrWall(d).fecha;
  };

  const procesadas: { id: string; cliente: string; fecha: string }[] = [];
  const errores: { id: string; error: string }[] = [];

  for (const cita of candidatas) {
    const fechaCitaCr = utcToCrWall(cita.fechaHora).fecha;
    if (fechaCitaCr !== fechaCrEnNDias(cita.diasRecordatorio)) continue;

    try {
      await notificarRecordatorio(cita.id);
      procesadas.push({ id: cita.id, cliente: cita.cliente.nombre, fecha: fechaCitaCr });
    } catch (e) {
      errores.push({ id: cita.id, error: e instanceof Error ? e.message : "desconocido" });
    }
  }

  return { revisadas: candidatas.length, enviadas: procesadas.length, procesadas, errores };
}

function autorizado(req: NextRequest): boolean {
  if (!env.CRON_SECRET) {
    // Sin secreto configurado: solo permitir en desarrollo local.
    return process.env.NODE_ENV !== "production";
  }
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
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}

// Vercel Cron usa GET; POST disponible para disparo manual autenticado.
export const POST = GET;
