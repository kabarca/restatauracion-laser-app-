import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatHora, formatMesLargo, grillaMes, mesActualCr, mesRelativo, utcToCrWall } from "@/lib/timezone";
import type { Cita, Cliente, EstadoCita } from "@/generated/prisma";

type CitaFila = Cita & { cliente: Cliente };

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const CHIP_POR_ESTADO: Record<EstadoCita, string> = {
  AGENDADA: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  RECORDADA: "bg-violet-50 text-violet-700 hover:bg-violet-100",
  COMPLETADA: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  CANCELADA: "bg-zinc-100 text-zinc-400 line-through hover:bg-zinc-200",
};

const DOT_POR_ESTADO: Record<EstadoCita, string> = {
  AGENDADA: "bg-blue-500",
  RECORDADA: "bg-violet-500",
  COMPLETADA: "bg-emerald-500",
  CANCELADA: "bg-zinc-400",
};

const LEYENDA: { estado: EstadoCita; label: string }[] = [
  { estado: "AGENDADA", label: "Agendada" },
  { estado: "RECORDADA", label: "Recordada" },
  { estado: "COMPLETADA", label: "Completada" },
  { estado: "CANCELADA", label: "Cancelada" },
];

export function CitasCalendario({
  citas,
  mes,
  estado,
}: {
  citas: CitaFila[];
  mes: string;
  estado?: string;
}) {
  const grilla = grillaMes(mes);
  const porDia = new Map<string, CitaFila[]>();
  for (const c of citas) {
    const fecha = utcToCrWall(c.fechaHora).fecha;
    (porDia.get(fecha) ?? porDia.set(fecha, []).get(fecha)!).push(c);
  }
  for (const lista of porDia.values()) lista.sort((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime());

  const qs = (m: string) => {
    const p = new URLSearchParams({ vista: "calendario", mes: m });
    if (estado) p.set("estado", estado);
    return `?${p.toString()}`;
  };
  const filas = grilla.length / 7;

  return (
    <div className="tarjeta space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">{formatMesLargo(mes)}</h2>
        <div className="flex items-center gap-1">
          <Link
            href={qs(mesRelativo(mes, -1))}
            aria-label="Mes anterior"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            ‹
          </Link>
          <Link
            href={qs(mesActualCr())}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            Hoy
          </Link>
          <Link
            href={qs(mesRelativo(mes, 1))}
            aria-label="Mes siguiente"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            ›
          </Link>
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto px-1">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 overflow-hidden rounded-t-xl border border-b-0 border-zinc-200">
            {DIAS_SEMANA.map((d) => (
              <div
                key={d}
                className="border-r border-zinc-200 bg-zinc-50 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 last:border-r-0"
              >
                {d}
              </div>
            ))}
          </div>
          <div
            className="grid grid-cols-7 overflow-hidden rounded-b-xl border border-zinc-200"
            style={{ gridTemplateRows: `repeat(${filas}, minmax(6.5rem, 1fr))` }}
          >
            {grilla.map((dia, i) => {
              const eventos = porDia.get(dia.fecha) ?? [];
              const visibles = eventos.slice(0, 3);
              const restantes = eventos.length - visibles.length;
              return (
                <div
                  key={dia.fecha}
                  className={cn(
                    "group relative flex flex-col gap-1 border-b border-r border-zinc-200 p-1.5",
                    (i + 1) % 7 === 0 && "border-r-0",
                    i >= grilla.length - 7 && "border-b-0",
                    !dia.enMes && "bg-zinc-50/60",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                        dia.hoy
                          ? "bg-marca font-semibold text-white"
                          : dia.enMes
                            ? "text-zinc-700"
                            : "text-zinc-300",
                      )}
                    >
                      {Number(dia.fecha.slice(8, 10))}
                    </span>
                    <Link
                      href={`/panel/citas/nueva?fecha=${dia.fecha}`}
                      title="Nueva cita este día"
                      className="flex h-5 w-5 items-center justify-center rounded text-zinc-300 opacity-0 transition hover:bg-zinc-100 hover:text-zinc-900 group-hover:opacity-100"
                    >
                      +
                    </Link>
                  </div>
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {visibles.map((c) => (
                      <Link
                        key={c.id}
                        href={`/panel/citas/${c.id}`}
                        className={cn(
                          "block truncate rounded px-1.5 py-0.5 text-[11px] leading-tight transition",
                          CHIP_POR_ESTADO[c.estado],
                        )}
                        title={`${formatHora(c.fechaHora)} · ${c.cliente.nombre}`}
                      >
                        {formatHora(c.fechaHora)} {c.cliente.nombre}
                      </Link>
                    ))}
                    {restantes > 0 && (
                      <div className="px-1.5 text-[11px] font-medium text-zinc-400">+{restantes} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        {LEYENDA.map((l) => (
          <span key={l.estado} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", DOT_POR_ESTADO[l.estado])} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
