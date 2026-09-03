"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { responderEncuesta, type EncuestaState } from "@/app/encuesta/[token]/actions";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primario w-full" disabled={pending}>
      {pending ? "Enviando…" : "Enviar"}
    </button>
  );
}

export function EncuestaForm({ token }: { token: string }) {
  const [state, action] = useActionState<EncuestaState, FormData>(
    responderEncuesta.bind(null, token),
    { ok: false },
  );
  const [puntaje, setPuntaje] = useState(0);

  if (state.ok) {
    return (
      <div className="tarjeta w-full max-w-md text-center">
        <p className="text-2xl">🙌</p>
        <h1 className="mt-2 text-lg font-semibold text-zinc-900">¡Gracias por tu respuesta!</h1>
        <p className="mt-1 text-sm text-zinc-500">Nos ayuda a mejorar el servicio.</p>
      </div>
    );
  }

  return (
    <form action={action} className="tarjeta w-full max-w-md space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">¿Cómo te fue con Restauración Láser?</h1>
        <p className="text-sm text-zinc-500">Tu opinión es anónima para el resto de clientes.</p>
      </div>

      <div>
        <p className="etiqueta">Calificación</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setPuntaje(n)}
              className={`h-11 w-11 rounded-lg border text-lg ${
                n <= puntaje
                  ? "border-amber-400 bg-amber-50"
                  : "border-zinc-200 bg-white hover:bg-zinc-50"
              }`}
              aria-label={`${n} de 5`}
            >
              {n <= puntaje ? "★" : "☆"}
            </button>
          ))}
        </div>
        <input type="hidden" name="puntaje" value={puntaje || ""} />
      </div>

      <div>
        <label className="etiqueta" htmlFor="comentario">
          Comentario (opcional)
        </label>
        <textarea id="comentario" name="comentario" rows={4} className="campo" />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Enviar />
    </form>
  );
}
