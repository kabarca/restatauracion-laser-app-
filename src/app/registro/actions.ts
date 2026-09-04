"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { enviarEmail } from "@/lib/email";
import { emailNuevaSolicitud } from "@/lib/plantillas";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  authUserId: z.string().min(1),
  nombre: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  rol: z.enum(["ADMIN", "STAFF"]),
});

export type SolicitudState = { ok: boolean; error?: string };

/**
 * Crea el perfil (tabla `usuarios`) de alguien que se acaba de registrar en
 * /registro — SIN aprobar. Valida contra Supabase Auth que el authUserId sea
 * real (esta acción es pública, sin sesión) y avisa por correo a los admins.
 */
export async function registrarSolicitud(
  _prev: SolicitudState,
  formData: FormData,
): Promise<SolicitudState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Revisá los datos del formulario." };
  const { authUserId, nombre, email, rol } = parsed.data;

  // Confirma que authUserId corresponde a un usuario real recién creado en
  // Supabase Auth con ese correo (evita que se llame esta acción con datos
  // inventados, ya que no requiere sesión).
  const admin = createSupabaseAdminClient();
  const { data, error: errAuth } = await admin.auth.admin.getUserById(authUserId);
  if (errAuth || !data.user || data.user.email?.toLowerCase() !== email.toLowerCase()) {
    return { ok: false, error: "No se pudo verificar la cuenta. Intentá de nuevo." };
  }

  // Confirma el correo automáticamente: el control de acceso real es la
  // aprobación del admin (abajo), no el link de confirmación de Supabase —
  // así no hace falta un segundo correo aparte para poder entrar.
  if (!data.user.email_confirmed_at) {
    await admin.auth.admin.updateUserById(authUserId, { email_confirm: true });
  }

  const existente = await prisma.usuario.findFirst({
    where: { OR: [{ email }, { authUserId }] },
  });
  if (existente) {
    return { ok: false, error: "Ya hay una cuenta con ese correo." };
  }

  await prisma.usuario.create({
    data: { authUserId, nombre, email, rol, aprobado: false },
  });

  // Avisar a los administradores activos y aprobados (o, si todavía no hay
  // ninguno, al correo de equipo configurado).
  const admins = await prisma.usuario.findMany({
    where: { rol: "ADMIN", activo: true, aprobado: true },
    select: { email: true },
  });
  const destinatarios = admins.length > 0 ? admins.map((a) => a.email) : [env.EMAIL_EQUIPO].filter(Boolean);

  if (destinatarios.length > 0) {
    const { subject, html, text } = emailNuevaSolicitud({ nombre, email, rol });
    await Promise.all(
      destinatarios.map((to) => enviarEmail({ to: to as string, subject, html, text })),
    );
  }

  return { ok: true };
}
