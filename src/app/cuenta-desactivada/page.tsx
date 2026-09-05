import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { CerrarSesion } from "@/components/cerrar-sesion";

export const dynamic = "force-dynamic";

export default async function CuentaDesactivadaPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");
  if (usuario.activo) redirect("/panel");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="tarjeta w-full max-w-sm space-y-4 text-center">
        <p className="text-3xl">🔒</p>
        <h1 className="text-lg font-semibold text-zinc-900">Cuenta desactivada</h1>
        <p className="text-sm text-zinc-600">
          Un administrador desactivó tu acceso ({usuario.email}). Si creés que es un error,
          escribile a un administrador de Restauración Láser.
        </p>
        <CerrarSesion />
      </div>
    </main>
  );
}
