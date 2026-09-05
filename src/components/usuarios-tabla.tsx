"use client";

import { useState, useTransition } from "react";
import { cambiarActivo, cambiarRol, eliminarUsuario } from "@/app/panel/usuarios/actions";
import type { Rol } from "@/generated/prisma";

type Fila = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
};

function AccionesFila({ usuario }: { usuario: Fila }) {
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function eliminar() {
    setError(null);
    startTransition(async () => {
      const res = await eliminarUsuario(usuario.id);
      if (!res.ok) {
        setError(res.error ?? "No se pudo eliminar.");
        setConfirmando(false);
        return;
      }
    });
  }

  if (confirmando) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-zinc-500">¿Eliminar a {usuario.nombre}?</span>
        <button
          className="text-xs font-medium text-red-600 underline hover:no-underline disabled:opacity-50"
          onClick={eliminar}
          disabled={pending}
        >
          {pending ? "Eliminando…" : "Sí, eliminar"}
        </button>
        <button
          className="text-xs font-medium text-zinc-500 underline hover:no-underline"
          onClick={() => setConfirmando(false)}
          disabled={pending}
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        className="text-xs font-medium text-zinc-700 underline hover:no-underline"
        onClick={() => cambiarActivo(usuario.id, !usuario.activo)}
      >
        {usuario.activo ? "Desactivar" : "Reactivar"}
      </button>
      <button
        className="text-xs font-medium text-red-600 underline hover:no-underline"
        onClick={() => setConfirmando(true)}
      >
        Eliminar
      </button>
    </div>
  );
}

export function UsuariosTabla({ usuarios, yoId }: { usuarios: Fila[]; yoId: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Correo</th>
            <th className="px-4 py-3">Rol</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {usuarios.map((u) => {
            const esYo = u.id === yoId;
            return (
              <tr key={u.id}>
                <td className="px-4 py-3 text-zinc-900">
                  {u.nombre} {esYo && <span className="text-xs text-zinc-400">(vos)</span>}
                </td>
                <td className="px-4 py-3 text-zinc-500">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    className="campo max-w-28 py-1"
                    defaultValue={u.rol}
                    disabled={esYo}
                    onChange={(e) => cambiarRol(u.id, e.target.value as "ADMIN" | "STAFF")}
                  >
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {u.activo ? (
                    <span className="text-emerald-600">Activo</span>
                  ) : (
                    <span className="text-zinc-400">Inactivo</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">{!esYo && <AccionesFila usuario={u} />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
