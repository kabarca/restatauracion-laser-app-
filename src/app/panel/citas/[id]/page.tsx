import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { requireUsuario } from "@/lib/auth";
import { formatFechaHora, formatFechaCorta, formatHora, utcToCrWall } from "@/lib/timezone";
import { nombreServicio } from "@/lib/servicios";
import { EstadoCitaBadge, EstadoMensajeBadge } from "@/components/estado-badge";
import { AccionesCita, ReintentarMensaje } from "@/components/acciones-cita";
import type { Canal, TipoMensaje } from "@/generated/prisma";

export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<TipoMensaje, string> = {
  CONFIRMACION: "Confirmación",
  RECORDATORIO: "Recordatorio",
  RECORDATORIO_DIA: "Recordatorio (mismo día)",
  REPROGRAMACION: "Reprogramación",
  CANCELACION: "Cancelación",
  ENCUESTA: "Encuesta",
};
const CANAL_LABEL: Record<Canal, string> = { WHATSAPP: "WhatsApp", EMAIL: "Correo" };

export default async function CitaDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ creada?: string }>;
}) {
  const usuario = await requireUsuario();
  const esAdmin = usuario.rol === "ADMIN";
  const { id } = await params;
  const { creada } = await searchParams;

  const cita = await prisma.cita.findUnique({
    where: { id },
    include: {
      cliente: true,
      creadaPor: true,
      encuesta: true,
      mensajes: { orderBy: { enviadoEn: "desc" } },
    },
  });
  if (!cita) notFound();

  const wall = utcToCrWall(cita.fechaHora);

  return (
    <div className="space-y-5">
      <Link href="/panel/citas" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Volver a citas
      </Link>

      {creada && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Cita creada. Se disparó la confirmación por WhatsApp y correo — revisá el registro abajo.
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{cita.cliente.nombre}</h1>
          <p className="text-zinc-600">{formatFechaHora(cita.fechaHora)}</p>
        </div>
        <EstadoCitaBadge estado={cita.estado} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="tarjeta space-y-2 text-sm">
          <h2 className="font-semibold text-zinc-900">Cliente</h2>
          <p>
            <span className="text-zinc-500">Teléfono:</span> {cita.cliente.telefono}
          </p>
          <p>
            <span className="text-zinc-500">Correo:</span> {cita.cliente.email}
          </p>
        </div>
        <div className="tarjeta space-y-2 text-sm">
          <h2 className="font-semibold text-zinc-900">Cita</h2>
          <p>
            <span className="text-zinc-500">Servicio:</span> {nombreServicio(cita.servicio) ?? "—"}
          </p>
          <p>
            <span className="text-zinc-500">Recordatorio:</span> {cita.diasRecordatorio} día(s) antes
            {cita.recordatorioEnviadoEn
              ? ` · enviado ${formatFechaCorta(cita.recordatorioEnviadoEn)}`
              : " · pendiente"}
          </p>
          <p>
            <span className="text-zinc-500">Recordatorio mismo día:</span>{" "}
            {cita.recordatorioMismoDia
              ? cita.recordatorioDiaEnviadoEn
                ? `enviado ${formatFechaCorta(cita.recordatorioDiaEnviadoEn)}`
                : "activado · pendiente"
              : "desactivado"}
          </p>
          <p>
            <span className="text-zinc-500">Confirmación:</span>{" "}
            {cita.confirmacionEnviadaEn
              ? `enviada ${formatFechaCorta(cita.confirmacionEnviadaEn)}`
              : "pendiente"}
          </p>
          {cita.ubicacionUrl && (
            <p>
              <span className="text-zinc-500">Ubicación:</span>{" "}
              <a
                href={cita.ubicacionUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-zinc-900 underline hover:no-underline"
              >
                Abrir en el mapa ↗
              </a>
            </p>
          )}
          {cita.motivoCancelacion && (
            <p className="text-red-600">
              <span className="text-zinc-500">Motivo cancelación:</span> {cita.motivoCancelacion}
            </p>
          )}
          <p className="text-xs text-zinc-400">Creada por {cita.creadaPor.nombre}</p>
        </div>
      </div>

      {esAdmin && (
        <div className="tarjeta">
          <h2 className="mb-3 font-semibold text-zinc-900">Acciones</h2>
          <AccionesCita
            citaId={cita.id}
            estado={cita.estado}
            fechaDefault={wall.fecha}
            horaDefault={wall.hora}
            recordatorioMismoDia={cita.recordatorioMismoDia}
            tieneEncuesta={cita.encuesta != null}
          />
        </div>
      )}

      {cita.encuesta && (
        <div className="tarjeta space-y-1 text-sm">
          <h2 className="font-semibold text-zinc-900">Encuesta de satisfacción</h2>
          <p>
            <span className="text-zinc-500">Enviada:</span>{" "}
            {formatFechaCorta(cita.encuesta.enviadaEn)}
          </p>
          {cita.encuesta.respondidaEn ? (
            <>
              <p>
                <span className="text-zinc-500">Puntaje:</span>{" "}
                <span className="text-amber-600">{"★".repeat(cita.encuesta.puntaje ?? 0)}</span>{" "}
                ({cita.encuesta.puntaje}/5)
              </p>
              {cita.encuesta.comentario && (
                <p>
                  <span className="text-zinc-500">Comentario:</span> {cita.encuesta.comentario}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-zinc-500">Sin responder todavía.</p>
              {esAdmin && (
                <p className="break-all text-xs text-zinc-400">
                  Enlace: {env.NEXT_PUBLIC_APP_URL}/encuesta/{cita.encuesta.token}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <div className="tarjeta">
        <h2 className="mb-3 font-semibold text-zinc-900">Registro de mensajes</h2>
        {cita.mensajes.length === 0 ? (
          <p className="text-sm text-zinc-400">Todavía no se ha enviado ningún mensaje.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-zinc-400">
                <tr>
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Canal</th>
                  <th className="py-2 pr-4">Destino</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {cita.mensajes.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 pr-4 text-zinc-500">
                      {formatFechaCorta(m.enviadoEn)} {formatHora(m.enviadoEn)}
                    </td>
                    <td className="py-2 pr-4">{TIPO_LABEL[m.tipo]}</td>
                    <td className="py-2 pr-4">{CANAL_LABEL[m.canal]}</td>
                    <td className="py-2 pr-4 text-zinc-500">{m.destino}</td>
                    <td className="py-2 pr-4">
                      <EstadoMensajeBadge estado={m.estado} />
                      {m.error && <div className="text-xs text-red-500">{m.error}</div>}
                    </td>
                    <td className="py-2 pr-4">
                      {esAdmin && m.estado === "FALLIDO" && (
                        <ReintentarMensaje citaId={cita.id} mensajeLogId={m.id} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
