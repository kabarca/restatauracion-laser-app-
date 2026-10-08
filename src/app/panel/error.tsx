"use client";

import { ErrorPantalla } from "@/components/error-pantalla";

// Atrapa errores de cualquier página del panel y deja visible el encabezado y
// el menú (el layout del panel no se desmonta), así se puede navegar a otra parte.
export default function PanelError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPantalla {...props} />;
}
