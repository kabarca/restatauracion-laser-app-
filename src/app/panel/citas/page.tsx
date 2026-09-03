import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUsuario } from "@/lib/auth";
import { crWallToUtc } from "@/lib/timezone";
import { FiltrosCitas } from "@/components/filtros-citas";
import { CitasTabla } from "@/components/citas-tabla";
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

      <CitasTabla citas={citas} vacio="No hay citas con estos filtros." />
      <p className="text-xs text-zinc-400">Mostrando hasta 200 citas.</p>
    </div>
  );
}
