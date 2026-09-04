import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { CerrarSesion } from "@/components/cerrar-sesion";

export const dynamic = "force-dynamic";

export default async function PendienteAprobacionPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");
  if (usuario.aprobado && usuario.activo) redirect("/panel");
  if (!usuario.activo) redirect("/cuenta-desactivada");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="tarjeta w-full max-w-sm space-y-4 text-center">
        <p className="text-3xl">⏳</p>
        <h1 className="text-lg font-semibold text-zinc-900">Cuenta pendiente de aprobación</h1>
        <p className="text-sm text-zinc-600">
          Hola {usuario.nombre.split(" ")[0]}, tu cuenta ({usuario.email}) todavía no fue aprobada por
          un administrador de Restauración Láser. Ya les avisamos por correo — en cuanto la aprueben,
          vas a poder entrar con normalidad.
        </p>
        <p className="text-xs text-zinc-400">
          Rol solicitado: {usuario.rol === "ADMIN" ? "Administrador" : "Staff"}
        </p>
        <CerrarSesion />
      </div>
    </main>
  );
}
