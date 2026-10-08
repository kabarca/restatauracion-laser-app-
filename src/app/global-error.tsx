"use client";

import "./globals.css";
import { ErrorPantalla } from "@/components/error-pantalla";

// Último recurso: falla el layout raíz. Debe traer su propio <html> y <body>.
export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <main className="flex min-h-screen items-center justify-center p-4">
          <ErrorPantalla {...props} irA="/login" irALabel="Ir al inicio de sesión" />
        </main>
      </body>
    </html>
  );
}
