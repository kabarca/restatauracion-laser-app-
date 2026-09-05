"use client";

import Image from "next/image";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    router.push(params.get("next") || "/panel");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="tarjeta w-full max-w-sm space-y-5">
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

      <button type="submit" className="btn-primario w-full" disabled={cargando}>
        {cargando ? "Ingresando…" : "Ingresar"}
      </button>

      <p className="text-center text-xs text-zinc-400">
        ¿Sos nuevo en el equipo? Pedile a un administrador que te invite desde el panel.
      </p>
    </form>
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
