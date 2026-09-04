"use client";

import { useState, useTransition } from "react";
import { aprobarUsuario, rechazarUsuario } from "@/app/panel/usuarios/actions";
import { formatFechaCorta } from "@/lib/timezone";

type Solicitud = {
  id: string;
  nombre: string;
  email: string;
  rol: "ADMIN" | "STAFF";
  createdAt: Date;
};

export function SolicitudesPendientes({ solicitudes }: { solicitudes: Solicitud[] }) {
  const [pending, startTransition] = useTransition();
  const [procesando, setProcesando] = useState<string | null>(null);

  if (solicitudes.length === 0) return null;

  return (
    <div className="tarjeta space-y-3 border-amber-200 bg-amber-50">
      <h2 className="text-sm font-semibold text-amber-900">
        Solicitudes pendientes de aprobación ({solicitudes.length})
      </h2>
      <div className="overflow-x-auto rounded-lg border border-amber-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-amber-100 bg-amber-50/60 text-left text-xs uppercase text-amber-700">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">Rol solicitado</th>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {solicitudes.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2 text-zinc-900">{s.nombre}</td>
                <td className="px-4 py-2 text-zinc-500">{s.email}</td>
                <td className="px-4 py-2">{s.rol === "ADMIN" ? "Administrador" : "Staff"}</td>
                <td className="px-4 py-2 text-zinc-500">{formatFechaCorta(s.createdAt)}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn-secundario py-1"
                      disabled={pending}
                      onClick={() => {
                        setProcesando(s.id);
                        startTransition(() => aprobarUsuario(s.id));
                      }}
                    >
                      {pending && procesando === s.id ? "…" : "Aprobar"}
                    </button>
                    <button
                      className="btn-peligro py-1"
                      disabled={pending}
                      onClick={() => {
                        if (!confirm(`¿Rechazar la solicitud de ${s.nombre}? Se borra la cuenta.`)) return;
                        setProcesando(s.id);
                        startTransition(() => rechazarUsuario(s.id));
                      }}
                    >
                      {pending && procesando === s.id ? "…" : "Rechazar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
