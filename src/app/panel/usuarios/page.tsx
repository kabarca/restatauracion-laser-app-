import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/auth";
import { env } from "@/lib/env";
import { UsuarioForm } from "@/components/usuario-form";
import { UsuariosTabla } from "@/components/usuarios-tabla";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const yo = await requireRol("ADMIN");
  const usuarios = await prisma.usuario.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-zinc-900">Equipo</h1>

      {!env.SUPABASE_SERVICE_ROLE_KEY && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Falta <code>SUPABASE_SERVICE_ROLE_KEY</code> en <code>.env.local</code> — no se pueden crear
          miembros nuevos hasta configurarla.
        </p>
      )}

      <UsuarioForm />
      <UsuariosTabla usuarios={usuarios} yoId={yo.id} />
    </div>
  );
}
