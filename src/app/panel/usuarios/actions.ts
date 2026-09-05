"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { usuarioSchema } from "@/lib/validation";
import { enviarEmail } from "@/lib/email";
import { emailInvitacion } from "@/lib/plantillas";

export type UsuarioFormState = {
  ok: boolean;
  error?: string;
  passwordTemporal?: string;
  emailCreado?: string;
  avisoEnviado?: boolean;
};

function generarPassword(): string {
  // 16 chars, legible para dictar una vez.
  return Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((b) => "abcdefghjkmnpqrstuvwxyz23456789"[b % 30])
    .join("");
}

export async function crearUsuario(
  _prev: UsuarioFormState,
  formData: FormData,
): Promise<UsuarioFormState> {
  await requireRol("ADMIN");

  const parsed = usuarioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Revisá los datos del formulario." };
  const { nombre, email, rol } = parsed.data;

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) return { ok: false, error: "Ya hay un miembro con ese correo." };

  const admin = createSupabaseAdminClient();
  const passwordTemporal = generarPassword();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: passwordTemporal,
    email_confirm: true,
    user_metadata: { nombre, debeCambiarPassword: true },
  });

  if (error || !data.user) {
    return { ok: false, error: `No se pudo crear en Supabase Auth: ${error?.message ?? "desconocido"}` };
  }

  await prisma.usuario.create({
    data: { authUserId: data.user.id, nombre, email, rol },
  });

  const { subject, html, text } = emailInvitacion({ nombre, rol, passwordTemporal });
  const envio = await enviarEmail({ to: email, subject, html, text });

  revalidatePath("/panel/usuarios");
  return {
    ok: true,
    passwordTemporal,
    emailCreado: email,
    avisoEnviado: envio.estado === "ENVIADO",
  };
}

export async function cambiarActivo(usuarioId: string, activo: boolean) {
  await requireRol("ADMIN");
  await prisma.usuario.update({ where: { id: usuarioId }, data: { activo } });
  revalidatePath("/panel/usuarios");
}

export async function cambiarRol(usuarioId: string, rol: "ADMIN" | "STAFF") {
  await requireRol("ADMIN");
  await prisma.usuario.update({ where: { id: usuarioId }, data: { rol } });
  revalidatePath("/panel/usuarios");
}

export async function eliminarUsuario(usuarioId: string): Promise<{ ok: boolean; error?: string }> {
  const yo = await requireRol("ADMIN");
  if (usuarioId === yo.id) {
    return { ok: false, error: "No podés eliminarte a vos mismo." };
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) return { ok: false, error: "Ese miembro ya no existe." };

  try {
    await prisma.usuario.delete({ where: { id: usuarioId } });
  } catch {
    return {
      ok: false,
      error: "No se pudo eliminar: tiene citas registradas a su nombre. Desactivalo en su lugar.",
    };
  }

  // La fila ya se borró; si esto falla, el usuario queda sin acceso pero
  // huérfano en Supabase Auth, así que solo lo dejamos registrado.
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(usuario.authUserId);
  if (error) console.error("No se pudo eliminar el usuario de Supabase Auth:", error.message);

  revalidatePath("/panel/usuarios");
  return { ok: true };
}
