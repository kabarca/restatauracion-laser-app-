"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CambiarPasswordPage() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    if (nueva.length < 8) {
      setError("La contraseña nueva debe tener al menos 8 caracteres.");
      return;
    }
    if (nueva !== repetir) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setCargando(true);
    const supabase = createSupabaseBrowserClient();

    // Confirma la contraseña actual reautenticando, para no dejar cambiar la
    // clave a quien solo encontró la sesión abierta en la compu de otro.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setCargando(false);
      setError("No se pudo verificar tu sesión. Volvé a entrar e intentá de nuevo.");
      return;
    }
    const { error: errAuth } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: actual,
    });
    if (errAuth) {
      setCargando(false);
      setError("La contraseña actual no es correcta.");
      return;
    }

    const { error: errUpdate } = await supabase.auth.updateUser({ password: nueva });
    setCargando(false);
    if (errUpdate) {
      setError("No se pudo cambiar la contraseña. Intentá de nuevo.");
      return;
    }
    setOk(true);
    setActual("");
    setNueva("");
    setRepetir("");
  }

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <h1 className="text-xl font-semibold text-zinc-900">Cambiar contraseña</h1>

      <form onSubmit={onSubmit} className="tarjeta space-y-4">
        <div>
          <label className="etiqueta" htmlFor="actual">
            Contraseña actual
          </label>
          <input
            id="actual"
            type="password"
            autoComplete="current-password"
            required
            className="campo"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
          />
        </div>

        <div>
          <label className="etiqueta" htmlFor="nueva">
            Contraseña nueva
          </label>
          <input
            id="nueva"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="campo"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
          />
        </div>

        <div>
          <label className="etiqueta" htmlFor="repetir">
            Repetí la contraseña nueva
          </label>
          <input
            id="repetir"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="campo"
            value={repetir}
            onChange={(e) => setRepetir(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {ok && <p className="text-sm text-emerald-600">Listo, tu contraseña quedó actualizada.</p>}

        <button type="submit" className="btn-primario w-full" disabled={cargando}>
          {cargando ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}
