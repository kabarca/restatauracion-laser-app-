import Link from "next/link";
import { formatFechaCorta, formatHora } from "@/lib/timezone";
import { nombreServicio } from "@/lib/servicios";
import { EstadoCitaBadge } from "@/components/estado-badge";
import type { Cita, Cliente } from "@/generated/prisma";

type Fila = Cita & { cliente: Cliente };

export function CitasTabla({
  citas,
  vacio = "No hay citas.",
  mostrarRecordatorio = true,
}: {
  citas: Fila[];
  vacio?: string;
  mostrarRecordatorio?: boolean;
}) {
  if (citas.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-400">
        {vacio}
      </div>
    );
  }

  return (
    <>
      {/* Móvil: tarjetas */}
      <ul className="space-y-2 sm:hidden">
        {citas.map((c) => (
          <li key={c.id} className="rounded-xl border border-zinc-200 bg-white p-3">
            <Link href={`/panel/citas/${c.id}`} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-zinc-900">{c.cliente.nombre}</div>
                <div className="mt-0.5 text-sm text-zinc-600">
                  {formatFechaCorta(c.fechaHora)} · {formatHora(c.fechaHora)}
                </div>
                <div className="mt-0.5 text-xs text-zinc-400">
                  {nombreServicio(c.servicio) ?? "Sin servicio"}
                  {mostrarRecordatorio &&
                    ` · ${
                      c.recordatorioEnviadoEn
                        ? `recordatorio enviado ${formatFechaCorta(c.recordatorioEnviadoEn)}`
                        : `recordatorio ${c.diasRecordatorio} día(s) antes`
                    }`}
                </div>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                <EstadoCitaBadge estado={c.estado} />
                {c.ubicacionUrl && (
                  <a
                    href={c.ubicacionUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-zinc-400"
                    title="Abrir ubicación en el mapa"
                  >
                    📍
                  </a>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Tablet / escritorio: tabla */}
      <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white sm:block">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Hora</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Estado</th>
              {mostrarRecordatorio && <th className="px-4 py-3">Recordatorio</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {citas.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/panel/citas/${c.id}`}
                    className="font-medium text-zinc-900 hover:underline"
                  >
                    {formatFechaCorta(c.fechaHora)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600">{formatHora(c.fechaHora)}</td>
                <td className="px-4 py-3">
                  <div className="text-zinc-900">{c.cliente.nombre}</div>
                  <div className="text-xs text-zinc-400">{c.cliente.telefono}</div>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {nombreServicio(c.servicio) ?? "—"}
                  {c.ubicacionUrl && (
                    <a
                      href={c.ubicacionUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Abrir ubicación en el mapa"
                      className="ml-2 text-zinc-400 hover:text-zinc-900"
                    >
                      📍
                    </a>
                  )}
                </td>
                <td className="px-4 py-3">
                  <EstadoCitaBadge estado={c.estado} />
                </td>
                {mostrarRecordatorio && (
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {c.recordatorioEnviadoEn
                      ? `Enviado ${formatFechaCorta(c.recordatorioEnviadoEn)}`
                      : `${c.diasRecordatorio} día(s) antes`}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
