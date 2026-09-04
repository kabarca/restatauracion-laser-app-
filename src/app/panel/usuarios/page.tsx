import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/auth";
import { env } from "@/lib/env";
import { UsuarioForm } from "@/components/usuario-form";
import { UsuariosTabla } from "@/components/usuarios-tabla";
import { SolicitudesPendientes } from "@/components/solicitudes-pendientes";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const yo = await requireRol("ADMIN");
  const todos = await prisma.usuario.findMany({ orderBy: { createdAt: "asc" } });
  const solicitudes = todos.filter((u) => !u.aprobado);
  const usuarios = todos.filter((u) => u.aprobado);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-zinc-900">Equipo</h1>

      {!env.SUPABASE_SERVICE_ROLE_KEY && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Falta <code>SUPABASE_SERVICE_ROLE_KEY</code> en <code>.env.local</code> — no se pueden crear
          miembros nuevos hasta configurarla.
        </p>
      )}

      <SolicitudesPendientes solicitudes={solicitudes} />

      <UsuarioForm />
      <UsuariosTabla usuarios={usuarios} yoId={yo.id} />

      <p className="text-xs text-zinc-400">
        Cualquiera puede pedir acceso desde{" "}
        <a href="/registro" target="_blank" rel="noreferrer" className="underline hover:no-underline">
          /registro
        </a>
        . Las solicitudes quedan bloqueadas hasta que un admin las aprueba acá arriba.
      </p>
    </div>
  );
}
