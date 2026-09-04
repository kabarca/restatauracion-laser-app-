import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Rol, Usuario } from "@/generated/prisma";

/**
 * Devuelve el perfil (tabla `usuarios`) de quien tiene sesión, o null si no hay
 * sesión / no existe fila. Puede venir con `activo: false` o `aprobado: false`
 * — quien llame decide qué hacer (ver requireUsuario). Cacheado por request.
 */
export const getUsuarioActual = cache(async (): Promise<Usuario | null> => {
  // Atajo SOLO para desarrollo local sin Supabase: si DEV_AUTOLOGIN_EMAIL está
  // definido y NO es producción, se usa ese usuario. Nunca definir en producción.
  if (process.env.NODE_ENV !== "production" && process.env.DEV_AUTOLOGIN_EMAIL) {
    return prisma.usuario.findUnique({ where: { email: process.env.DEV_AUTOLOGIN_EMAIL } });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return prisma.usuario.findUnique({ where: { authUserId: user.id } });
});

/**
 * Exige sesión válida, cuenta activa y aprobada. Redirige a /login si no hay
 * sesión/fila, a /cuenta-desactivada si un admin la desactivó, o a
 * /pendiente-aprobacion si todavía no la aprueban (autorregistro en /registro).
 */
export async function requireUsuario(): Promise<Usuario> {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");
  if (!usuario.activo) redirect("/cuenta-desactivada");
  if (!usuario.aprobado) redirect("/pendiente-aprobacion");
  return usuario;
}

/** Exige un rol específico. Redirige a /panel si no alcanza. */
export async function requireRol(...roles: Rol[]): Promise<Usuario> {
  const usuario = await requireUsuario();
  if (!roles.includes(usuario.rol)) redirect("/panel");
  return usuario;
}
