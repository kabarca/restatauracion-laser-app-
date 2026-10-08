"use client";

import { ErrorPantalla } from "@/components/error-pantalla";

// Errores fuera del panel (login, encuesta pública, etc.).
export default function AppError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <ErrorPantalla {...props} irA="/login" irALabel="Ir al inicio de sesión" />
    </main>
  );
}
