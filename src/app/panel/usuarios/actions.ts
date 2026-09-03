"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { usuarioSchema } from "@/lib/validation";

export type UsuarioFormState = {
  ok: boolean;
  error?: string;
  passwordTemporal?: string;
  emailCreado?: string;
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
    user_metadata: { nombre },
  });

  if (error || !data.user) {
    return { ok: false, error: `No se pudo crear en Supabase Auth: ${error?.message ?? "desconocido"}` };
  }

  await prisma.usuario.create({
    data: { authUserId: data.user.id, nombre, email, rol },
  });

  revalidatePath("/panel/usuarios");
  return { ok: true, passwordTemporal, emailCreado: email };
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
