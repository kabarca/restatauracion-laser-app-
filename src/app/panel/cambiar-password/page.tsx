"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CambiarPasswordPage() {
  return (
    <Suspense>
      <CambiarPasswordForm />
    </Suspense>
  );
}

function CambiarPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const obligatorio = params.get("obligatorio") === "1";

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

    // Además de la nueva contraseña, apagamos la marca de "temporal" para que
    // no lo volvamos a mandar para acá en el próximo inicio de sesión.
    const { error: errUpdate } = await supabase.auth.updateUser({
      password: nueva,
      data: { debeCambiarPassword: false },
    });
    setCargando(false);
    if (errUpdate) {
      setError("No se pudo cambiar la contraseña. Intentá de nuevo.");
      return;
    }
    setOk(true);
    setActual("");
    setNueva("");
    setRepetir("");

    if (obligatorio) {
      router.replace("/panel");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <h1 className="text-xl font-semibold text-zinc-900">Cambiar contraseña</h1>
      {obligatorio && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Iniciaste sesión con una contraseña temporal — elegí una nueva para poder seguir.
        </p>
      )}

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
