"use client";

import Image from "next/image";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Pantalla de transición al entrar — logo + barra de progreso de la marca. */
function TransicionEntrada() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white animate-[rl-fade-in_200ms_ease-out] motion-reduce:animate-none">
      <div className="flex flex-col items-center gap-7">
        <Image
          src="/logo-full.png"
          alt="Restauración Láser"
          width={220}
          height={121}
          priority
          className="h-16 w-auto animate-[rl-logo-in_600ms_cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:animate-none"
        />
        <div className="h-[3px] w-36 overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full w-full origin-left rounded-full bg-marca animate-[rl-progress_700ms_cubic-bezier(0.35,0,0.1,1)_120ms_forwards] motion-reduce:animate-none" />
        </div>
        <p className="animate-[rl-fade-in_500ms_ease-out_200ms_both] text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400 motion-reduce:animate-none">
          Entrando al panel
        </p>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [entrando, setEntrando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setCargando(false);
      setError("Correo o contraseña incorrectos.");
      return;
    }
    // Éxito: mostramos la transición y dejamos que la animación corra antes
    // de navegar. El overlay tapa el panel mientras carga en el servidor.
    setEntrando(true);
    await new Promise((r) => setTimeout(r, 750));
    router.push(params.get("next") || "/panel");
    router.refresh();
  }

  return (
    <>
      {entrando && <TransicionEntrada />}
      <form
        onSubmit={onSubmit}
        className={`tarjeta w-full max-w-sm space-y-5 animate-[rl-fade-up_500ms_cubic-bezier(0.2,0.7,0.2,1)] transition-all duration-300 motion-reduce:animate-none ${
          entrando ? "scale-[0.98] opacity-0 blur-[2px]" : ""
        }`}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="sr-only">Restauración Láser</h1>
          <Image src="/logo-full.png" alt="Restauración Láser" width={160} height={88} priority className="h-14 w-auto" />
          <p className="text-sm text-zinc-500">Panel de recordatorios de citas</p>
        </div>

        <div>
          <label className="etiqueta" htmlFor="email">
            Correo
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="campo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="etiqueta" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="campo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primario w-full" disabled={cargando || entrando}>
          {cargando || entrando ? "Ingresando…" : "Ingresar"}
        </button>

        <p className="text-center text-xs text-zinc-400">
          ¿Sos nuevo en el equipo? Pedile a un administrador que te invite desde el panel.
        </p>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
