"use client";

import Image from "next/image";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { registrarSolicitud } from "@/app/registro/actions";

export default function RegistroPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [rol, setRol] = useState<"STAFF" | "ADMIN">("STAFF");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error: errAuth } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    });

    if (errAuth || !data.user) {
      setCargando(false);
      setError(
        errAuth?.message?.includes("already registered")
          ? "Ya existe una cuenta con ese correo."
          : "No se pudo crear la cuenta. Intentá de nuevo.",
      );
      return;
    }

    const fd = new FormData();
    fd.set("authUserId", data.user.id);
    fd.set("nombre", nombre);
    fd.set("email", email);
    fd.set("rol", rol);
    const resultado = await registrarSolicitud({ ok: false }, fd);
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error ?? "Algo salió mal. Intentá de nuevo.");
      return;
    }
    setListo(true);
  }

  if (listo) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="tarjeta w-full max-w-sm space-y-3 text-center">
          <p className="text-3xl">✅</p>
          <h1 className="text-lg font-semibold text-zinc-900">¡Listo, {nombre.split(" ")[0]}!</h1>
          <p className="text-sm text-zinc-600">
            Le avisamos a los administradores de Restauración Láser. En cuanto aprueben tu cuenta,
            vas a poder entrar con el correo y la contraseña que elegiste.
          </p>
          <a href="/login" className="btn-secundario mt-2 inline-block">
            Ir al login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="tarjeta w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="sr-only">Crear cuenta — Restauración Láser</h1>
          <Image
            src="/logo-full.png"
            alt="Restauración Láser"
            width={160}
            height={88}
            priority
            className="h-14 w-auto"
          />
          <p className="text-sm text-zinc-500">Creá tu cuenta del equipo</p>
        </div>

        <div>
          <label className="etiqueta" htmlFor="nombre">
            Nombre completo
          </label>
          <input
            id="nombre"
            required
            className="campo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
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
            autoComplete="new-password"
            required
            minLength={8}
            className="campo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="etiqueta" htmlFor="password2">
            Repetí la contraseña
          </label>
          <input
            id="password2"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="campo"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />
        </div>

        <div>
          <span className="etiqueta">Tu rol en el equipo</span>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={`campo flex cursor-pointer items-center justify-center gap-2 ${rol === "STAFF" ? "border-marca ring-2 ring-marca-suave" : ""}`}
            >
              <input
                type="radio"
                name="rol"
                value="STAFF"
                checked={rol === "STAFF"}
                onChange={() => setRol("STAFF")}
                className="sr-only"
              />
              Staff
            </label>
            <label
              className={`campo flex cursor-pointer items-center justify-center gap-2 ${rol === "ADMIN" ? "border-marca ring-2 ring-marca-suave" : ""}`}
            >
              <input
                type="radio"
                name="rol"
                value="ADMIN"
                checked={rol === "ADMIN"}
                onChange={() => setRol("ADMIN")}
                className="sr-only"
              />
              Administrador
            </label>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Staff: solo puede ver las citas agendadas. Administrador: acceso completo. Un admin va a
            revisar y aprobar tu solicitud antes de que puedas entrar.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primario w-full" disabled={cargando}>
          {cargando ? "Creando cuenta…" : "Crear cuenta"}
        </button>

        <p className="text-center text-sm text-zinc-500">
          ¿Ya tenés cuenta?{" "}
          <a href="/login" className="font-medium text-marca hover:underline">
            Ingresá acá
          </a>
        </p>
      </form>
    </main>
  );
}
