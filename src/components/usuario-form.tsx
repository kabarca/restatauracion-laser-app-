"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { crearUsuario, type UsuarioFormState } from "@/app/panel/usuarios/actions";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primario" disabled={pending}>
      {pending ? "Creando…" : "Crear miembro"}
    </button>
  );
}

export function UsuarioForm() {
  const [state, action] = useActionState<UsuarioFormState, FormData>(crearUsuario, { ok: false });

  return (
    <form action={action} className="tarjeta space-y-4">
      <h2 className="text-sm font-semibold text-zinc-900">Agregar miembro del equipo</h2>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && state.passwordTemporal && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <p className="font-medium">Miembro creado: {state.emailCreado}</p>
          <p className="mt-1">
            Contraseña temporal (mostrala una sola vez, pedile que la cambie):{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono">{state.passwordTemporal}</code>
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className="etiqueta" htmlFor="nombre">
            Nombre
          </label>
          <input id="nombre" name="nombre" required className="campo" />
        </div>
        <div className="sm:col-span-1">
          <label className="etiqueta" htmlFor="email">
            Correo
          </label>
          <input id="email" name="email" type="email" required className="campo" />
        </div>
        <div className="sm:col-span-1">
          <label className="etiqueta" htmlFor="rol">
            Rol
          </label>
          <select id="rol" name="rol" className="campo" defaultValue="STAFF">
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      <Enviar />
    </form>
  );
}
