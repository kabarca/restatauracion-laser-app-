import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/auth";
import { crWallToUtc, formatFechaCorta, formatHora } from "@/lib/timezone";
import { nombreServicio } from "@/lib/servicios";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";

function csvCell(v: string | null | undefined) {
  const s = (v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET(req: NextRequest) {
  const usuario = await getUsuarioActual();
  if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const where: Prisma.CitaWhereInput = {};
  if (sp.get("estado")) where.estado = sp.get("estado") as Prisma.CitaWhereInput["estado"];
  const q = sp.get("q");
  if (q) {
    where.cliente = {
      OR: [
        { nombre: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { telefono: { contains: q } },
      ],
    };
  }
  if (sp.get("desde") || sp.get("hasta")) {
    where.fechaHora = {};
    if (sp.get("desde")) where.fechaHora.gte = crWallToUtc(sp.get("desde")!, "00:00");
    if (sp.get("hasta")) where.fechaHora.lte = crWallToUtc(sp.get("hasta")!, "23:59");
  }

  const citas = await prisma.cita.findMany({
    where,
    include: { cliente: true, creadaPor: true },
    orderBy: { fechaHora: "asc" },
  });

  const encabezado = [
    "Fecha",
    "Hora",
    "Cliente",
    "Teléfono",
    "Correo",
    "Servicio",
    "Estado",
    "Días recordatorio",
    "Confirmación enviada",
    "Recordatorio enviado",
    "Nota",
    "Creada por",
  ];

  const filas = citas.map((c) =>
    [
      formatFechaCorta(c.fechaHora),
      formatHora(c.fechaHora),
      c.cliente.nombre,
      c.cliente.telefono,
      c.cliente.email,
      nombreServicio(c.servicio) ?? "",
      c.estado,
      String(c.diasRecordatorio),
      c.confirmacionEnviadaEn ? c.confirmacionEnviadaEn.toISOString() : "",
      c.recordatorioEnviadoEn ? c.recordatorioEnviadoEn.toISOString() : "",
      c.nota ?? "",
      c.creadaPor.nombre,
    ]
      .map(csvCell)
      .join(","),
  );

  const csv = "﻿" + [encabezado.map(csvCell).join(","), ...filas].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="citas-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
