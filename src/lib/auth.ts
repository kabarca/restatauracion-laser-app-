import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Rol, Usuario } from "@/generated/prisma";

/**
 * Devuelve el perfil (tabla `usuarios`) del miembro autenticado, o null.
 * Cacheado por request para no repetir la consulta en cada Server Component.
 */
export const getUsuarioActual = cache(async (): Promise<Usuario | null> => {
  // Atajo SOLO para desarrollo local sin Supabase: si DEV_AUTOLOGIN_EMAIL está
  // definido y NO es producción, se usa ese usuario. Nunca definir en producción.
  if (process.env.NODE_ENV !== "production" && process.env.DEV_AUTOLOGIN_EMAIL) {
    const dev = await prisma.usuario.findUnique({
      where: { email: process.env.DEV_AUTOLOGIN_EMAIL },
    });
    return dev && dev.activo ? dev : null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { authUserId: user.id },
  });

  if (!usuario || !usuario.activo) return null;
  return usuario;
});

/** Exige sesión válida. Redirige a /login si no hay. */
export async function requireUsuario(): Promise<Usuario> {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
}

/** Exige un rol específico. Redirige a /panel si no alcanza. */
export async function requireRol(...roles: Rol[]): Promise<Usuario> {
  const usuario = await requireUsuario();
  if (!roles.includes(usuario.rol)) redirect("/panel");
  return usuario;
}
