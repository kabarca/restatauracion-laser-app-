import Link from "next/link";
import { requireRol } from "@/lib/auth";
import { resumenEncuestas } from "@/lib/panel-data";
import { formatFechaCorta } from "@/lib/timezone";
import { nombreServicio } from "@/lib/servicios";

export const dynamic = "force-dynamic";

function Estrellas({ n }: { n: number }) {
  return (
    <span className="text-amber-500" title={`${n} de 5`}>
      {"★".repeat(n)}
      <span className="text-zinc-300">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export default async function EncuestasPage() {
  await requireRol("ADMIN");
  const r = await resumenEncuestas();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-zinc-900">Encuestas de satisfacción</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="tarjeta">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Promedio</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">
            {r.promedio != null ? r.promedio.toFixed(1) : "—"}
            <span className="text-base font-normal text-zinc-400"> / 5</span>
          </div>
        </div>
        <div className="tarjeta">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Respondidas</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">{r.respondidas}</div>
        </div>
        <div className="tarjeta">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Tasa de respuesta</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">
            {r.enviadas > 0 ? `${Math.round(r.tasaRespuesta * 100)}%` : "—"}
          </div>
          <div className="mt-0.5 text-xs text-zinc-400">{r.enviadas} enviadas</div>
        </div>
      </div>

      {r.ultimas.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-400">
          Todavía no hay respuestas.
        </div>
      ) : (
        <>
          {/* Móvil: lista */}
          <ul className="space-y-2 sm:hidden">
            {r.ultimas.map((e) => (
              <li key={e.id} className="rounded-xl border border-zinc-200 bg-white p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/panel/citas/${e.citaId}`} className="font-medium text-zinc-900">
                    {e.cita.cliente.nombre}
                  </Link>
                  {e.puntaje != null && <Estrellas n={e.puntaje} />}
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  {e.respondidaEn ? formatFechaCorta(e.respondidaEn) : "Sin responder"}
                  {nombreServicio(e.cita.servicio) ? ` · ${nombreServicio(e.cita.servicio)}` : ""}
                </div>
                {e.comentario && <p className="mt-1 text-zinc-600">{e.comentario}</p>}
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
                  <th className="px-4 py-3">Servicio</th>
                  <th className="px-4 py-3">Puntaje</th>
                  <th className="px-4 py-3">Comentario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {r.ultimas.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-500">
                      {e.respondidaEn ? formatFechaCorta(e.respondidaEn) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/panel/citas/${e.citaId}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {e.cita.cliente.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {nombreServicio(e.cita.servicio) ?? "—"}
                    </td>
                    <td className="px-4 py-3">{e.puntaje != null && <Estrellas n={e.puntaje} />}</td>
                    <td className="px-4 py-3 text-zinc-600">{e.comentario ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
