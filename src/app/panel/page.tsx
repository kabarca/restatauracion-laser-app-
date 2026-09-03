import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUsuario } from "@/lib/auth";
import { crWallToUtc, formatFechaCorta, formatHora } from "@/lib/timezone";
import { nombreServicio } from "@/lib/servicios";
import { EstadoCitaBadge } from "@/components/estado-badge";
import { FiltrosCitas } from "@/components/filtros-citas";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function CitasPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUsuario();
  const sp = await searchParams;

  const where: Prisma.CitaWhereInput = {};
  if (sp.estado) where.estado = sp.estado as Prisma.CitaWhereInput["estado"];
  if (sp.q) {
    where.cliente = {
      OR: [
        { nombre: { contains: sp.q, mode: "insensitive" } },
        { email: { contains: sp.q, mode: "insensitive" } },
        { telefono: { contains: sp.q } },
      ],
    };
  }
  if (sp.desde || sp.hasta) {
    where.fechaHora = {};
    if (sp.desde) where.fechaHora.gte = crWallToUtc(sp.desde, "00:00");
    if (sp.hasta) where.fechaHora.lte = crWallToUtc(sp.hasta, "23:59");
  }

  const citas = await prisma.cita.findMany({
    where,
    include: { cliente: true },
    orderBy: { fechaHora: "asc" },
    take: 200,
  });

  const qs = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Citas</h1>
        <div className="flex gap-2">
          <a className="btn-secundario" href={`/panel/citas/export${qs ? `?${qs}` : ""}`}>
            Exportar CSV
          </a>
          <Link className="btn-primario" href="/panel/citas/nueva">
            Nueva cita
          </Link>
        </div>
      </div>

      <div className="tarjeta">
        <FiltrosCitas />
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Hora</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Recordatorio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {citas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-400">
                  No hay citas con estos filtros.
                </td>
              </tr>
            )}
            {citas.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link href={`/panel/citas/${c.id}`} className="font-medium text-zinc-900 hover:underline">
                    {formatFechaCorta(c.fechaHora)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600">{formatHora(c.fechaHora)}</td>
                <td className="px-4 py-3">
                  <div className="text-zinc-900">{c.cliente.nombre}</div>
                  <div className="text-xs text-zinc-400">{c.cliente.telefono}</div>
                </td>
                <td className="px-4 py-3 text-zinc-600">{nombreServicio(c.servicio) ?? "—"}</td>
                <td className="px-4 py-3">
                  <EstadoCitaBadge estado={c.estado} />
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {c.recordatorioEnviadoEn
                    ? `Enviado ${formatFechaCorta(c.recordatorioEnviadoEn)}`
                    : `${c.diasRecordatorio} día(s) antes`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-400">Mostrando hasta 200 citas.</p>
    </div>
  );
}
