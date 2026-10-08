"use client";

import { useEffect } from "react";

/**
 * Pantalla amigable cuando una página falla en el servidor o al renderizar.
 * `error.digest` es el código que aparece en los logs de Vercel — se muestra
 * en pequeño para poder pasarlo a soporte.
 */
export function ErrorPantalla({
  error,
  reset,
  irA = "/panel",
  irALabel = "Ir al inicio",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  irA?: string;
  irALabel?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <div className="tarjeta w-full space-y-4 p-6 sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-marca-suave text-2xl">
          ⚠️
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-zinc-900">Algo salió mal</h1>
          <p className="text-sm text-zinc-500">
            No pudimos cargar esta página. Reintentá; si el problema continúa, avisale a un
            administrador.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="btn-primario">
            Reintentar
          </button>
          {/* <a> a propósito: fuerza una carga completa y descarta cualquier estado roto. */}
          <a href={irA} className="btn-secundario">
            {irALabel}
          </a>
        </div>
        {error.digest && (
          <p className="text-[11px] text-zinc-400">Código de error: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
