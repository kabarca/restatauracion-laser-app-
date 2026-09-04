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
  const cols = mostrarRecordatorio ? 6 : 5;
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
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
          {citas.length === 0 && (
            <tr>
              <td colSpan={cols} className="px-4 py-10 text-center text-zinc-400">
                {vacio}
              </td>
            </tr>
          )}
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
  );
}
