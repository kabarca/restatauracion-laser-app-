import Link from "next/link";
import { requireUsuario } from "@/lib/auth";
import { resumenTablero } from "@/lib/panel-data";
import { formatFechaCorta, formatHora } from "@/lib/timezone";
import { nombreServicio } from "@/lib/servicios";
import { CitasTabla } from "@/components/citas-tabla";
import { EstadoMensajeBadge } from "@/components/estado-badge";
import { ReintentarFallidos } from "@/components/reintentar-fallidos";

export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<string, string> = {
  CONFIRMACION: "Confirmación",
  RECORDATORIO: "Recordatorio",
  REPROGRAMACION: "Reprogramación",
  CANCELACION: "Cancelación",
};

function Stat({
  label,
  valor,
  detalle,
  alerta,
}: {
  label: string;
  valor: number;
  detalle?: string;
  alerta?: boolean;
}) {
  return (
    <div className="tarjeta p-4 sm:p-5">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${alerta ? "text-red-600" : "text-zinc-900"}`}>
        {valor}
      </div>
      {detalle && <div className="mt-0.5 text-xs text-zinc-400">{detalle}</div>}
    </div>
  );
}

export default async function TableroPage() {
  const usuario = await requireUsuario();
  const esAdmin = usuario.rol === "ADMIN";
  const r = await resumenTablero();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Hola, {usuario.nombre.split(" ")[0]}</h1>
          <p className="text-sm text-zinc-500">Resumen de citas y envíos</p>
        </div>
        {esAdmin && (
          <Link className="btn-primario" href="/panel/citas/nueva">
            Nueva cita
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Citas hoy" valor={r.citasHoy.length} />
        <Stat label="Próximos 7 días" valor={r.proximas.length} />
        <Stat
          label="Recordatorios pendientes"
          valor={r.recordatoriosPendientes.length}
          detalle={
            r.recordatoriosAtrasados.length > 0
              ? `${r.recordatoriosAtrasados.length} atrasado(s) — salen 9:00 a. m.`
              : "el cron los envía 9:00 a. m."
          }
        />
        <Stat
          label="Envíos fallidos (14 días)"
          valor={r.fallidos.length}
          alerta={r.fallidos.length > 0}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">Citas de hoy</h2>
        <CitasTabla
          citas={r.citasHoy}
          vacio="No hay citas para hoy."
          mostrarRecordatorio={false}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Recordatorios pendientes</h2>
          <Link href="/panel/citas?estado=AGENDADA" className="text-sm text-zinc-500 hover:text-zinc-900">
            Ver todas →
          </Link>
        </div>
        {r.recordatoriosPendientes.length === 0 ? (
          <p className="text-sm text-zinc-400">Nada pendiente.</p>
        ) : (
          <>
            {/* Móvil: lista */}
            <ul className="space-y-2 sm:hidden">
              {r.recordatoriosPendientes.map((c) => {
                const atrasado = r.recordatoriosAtrasados.some((a) => a.id === c.id);
                return (
                  <li key={c.id} className="rounded-xl border border-zinc-200 bg-white p-3 text-sm">
                    <Link href={`/panel/citas/${c.id}`} className="font-medium text-zinc-900">
                      {c.cliente.nombre}
                    </Link>
                    <div className="mt-0.5 text-zinc-500">
                      {formatFechaCorta(c.fechaHora)} · {formatHora(c.fechaHora)}
                      {nombreServicio(c.servicio) ? ` · ${nombreServicio(c.servicio)}` : ""}
                    </div>
                    <div className="mt-0.5 text-xs">
                      {atrasado ? (
                        <span className="text-amber-600">Atrasado — sale en el próximo envío</span>
                      ) : (
                        <span className="text-zinc-500">
                          Sale hoy ({c.diasRecordatorio} día(s) antes)
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Tablet / escritorio: tabla */}
            <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white sm:block">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Cita</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Servicio</th>
                    <th className="px-4 py-3">Recordatorio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {r.recordatoriosPendientes.map((c) => {
                    const atrasado = r.recordatoriosAtrasados.some((a) => a.id === c.id);
                    return (
                      <tr key={c.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/panel/citas/${c.id}`}
                            className="font-medium text-zinc-900 hover:underline"
                          >
                            {formatFechaCorta(c.fechaHora)} · {formatHora(c.fechaHora)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">{c.cliente.nombre}</td>
                        <td className="px-4 py-3 text-zinc-600">
                          {nombreServicio(c.servicio) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {atrasado ? (
                            <span className="text-amber-600">Atrasado — sale en el próximo envío</span>
                          ) : (
                            <span className="text-zinc-500">
                              Sale hoy ({c.diasRecordatorio} día(s) antes)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">Envíos fallidos (últimos 14 días)</h2>
        {r.fallidos.length === 0 ? (
          <p className="text-sm text-zinc-400">Sin fallos recientes.</p>
        ) : (
          <>
            {/* Móvil: lista */}
            <ul className="space-y-2 sm:hidden">
              {r.fallidos.map((m) => (
                <li key={m.id} className="rounded-xl border border-zinc-200 bg-white p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/panel/citas/${m.citaId}`} className="font-medium text-zinc-900">
                      {m.cita.cliente.nombre}
                    </Link>
                    <EstadoMensajeBadge estado={m.estado} />
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {formatFechaCorta(m.enviadoEn)} {formatHora(m.enviadoEn)} ·{" "}
                    {TIPO_LABEL[m.tipo] ?? m.tipo} / {m.canal === "WHATSAPP" ? "WhatsApp" : "Correo"}
                  </div>
                  {m.error && <div className="mt-0.5 text-xs text-red-500">{m.error}</div>}
                </li>
              ))}
            </ul>

            {/* Tablet / escritorio: tabla */}
            <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white sm:block">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Tipo / canal</th>
                    <th className="px-4 py-3">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {r.fallidos.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 text-zinc-500">
                        {formatFechaCorta(m.enviadoEn)} {formatHora(m.enviadoEn)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/panel/citas/${m.citaId}`}
                          className="font-medium text-zinc-900 hover:underline"
                        >
                          {m.cita.cliente.nombre}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {TIPO_LABEL[m.tipo] ?? m.tipo} / {m.canal === "WHATSAPP" ? "WhatsApp" : "Correo"}
                      </td>
                      <td className="px-4 py-3">
                        <EstadoMensajeBadge estado={m.estado} />
                        {m.error && <div className="text-xs text-red-500">{m.error}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {esAdmin && <ReintentarFallidos cantidad={r.fallidos.length} />}
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">Próximos 7 días</h2>
        <CitasTabla citas={r.proximas} vacio="Sin citas en los próximos 7 días." />
      </section>
    </div>
  );
}
