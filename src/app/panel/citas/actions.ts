"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/auth";
import { env } from "@/lib/env";
import { citaFormSchema, reprogramarSchema } from "@/lib/validation";
import {
  notificarConfirmacion,
  notificarReprogramacion,
  notificarCancelacion,
  notificarEncuesta,
  reintentarMensaje,
  reintentarTodosLosFallidos,
} from "@/lib/notificaciones";

export type FormState = { ok: boolean; error?: string; fieldErrors?: Record<string, string[]> };

function fieldErrors(e: z.ZodError): Record<string, string[]> {
  return e.flatten().fieldErrors as Record<string, string[]>;
}

/** Flujo A + B: crea la cita y dispara confirmación inmediata (WhatsApp + email). */
export async function crearCita(_prev: FormState, formData: FormData): Promise<FormState> {
  const usuario = await requireRol("ADMIN");

  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = citaFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Revisá los campos marcados.", fieldErrors: fieldErrors(parsed.error) };
  }
  const d = parsed.data;

  const cita = await prisma.cita.create({
    data: {
      cliente: {
        create: {
          nombre: d.clienteNombre,
          email: d.clienteEmail,
          telefono: d.telefonoE164,
        },
      },
      servicio: d.servicio,
      ubicacionUrl: d.ubicacionUrl,
      fechaHora: d.fechaHora,
      diasRecordatorio: d.diasRecordatorio ?? env.RECORDATORIO_DIAS_DEFAULT,
      recordatorioMismoDia: d.recordatorioMismoDia,
      creadaPor: { connect: { id: usuario.id } },
    },
  });

  try {
    await notificarConfirmacion(cita.id);
  } catch (e) {
    // La cita quedó creada; el envío se puede reintentar desde el detalle.
    console.error("Fallo al enviar confirmación:", e);
  }

  revalidatePath("/panel", "layout");
  redirect(`/panel/citas/${cita.id}?creada=1`);
}

export async function reprogramarCita(
  citaId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRol("ADMIN");
  const parsed = reprogramarSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Fecha u hora inválida." };

  await prisma.cita.update({
    where: { id: citaId },
    data: {
      fechaHora: parsed.data.fechaHora,
      // Nueva fecha ⇒ el recordatorio debe volver a salir.
      recordatorioEnviadoEn: null,
      estado: "AGENDADA",
    },
  });

  try {
    await notificarReprogramacion(citaId);
  } catch (e) {
    console.error("Fallo al avisar reprogramación:", e);
  }

  revalidatePath("/panel", "layout");
  return { ok: true };
}

export async function cancelarCita(
  citaId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRol("ADMIN");
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  await prisma.cita.update({
    where: { id: citaId },
    data: { estado: "CANCELADA", canceladaEn: new Date(), motivoCancelacion: motivo },
  });

  try {
    await notificarCancelacion(citaId);
  } catch (e) {
    console.error("Fallo al avisar cancelación:", e);
  }

  revalidatePath("/panel", "layout");
  return { ok: true };
}

export async function marcarEstado(citaId: string, estado: "COMPLETADA" | "AGENDADA") {
  await requireRol("ADMIN");
  await prisma.cita.update({ where: { id: citaId }, data: { estado } });
  revalidatePath("/panel", "layout");
}

export async function reenviarMensaje(citaId: string, mensajeLogId: string) {
  await requireRol("ADMIN");
  await reintentarMensaje(mensajeLogId);
  revalidatePath("/panel", "layout");
}

export async function reenviarConfirmacion(citaId: string) {
  await requireRol("ADMIN");
  await notificarConfirmacion(citaId);
  revalidatePath("/panel", "layout");
}

export async function reintentarFallidos() {
  await requireRol("ADMIN");
  const resumen = await reintentarTodosLosFallidos();
  revalidatePath("/panel", "layout");
  return resumen;
}

export async function alternarRecordatorioMismoDia(citaId: string, valor: boolean) {
  await requireRol("ADMIN");
  await prisma.cita.update({ where: { id: citaId }, data: { recordatorioMismoDia: valor } });
  revalidatePath("/panel", "layout");
}

export async function enviarEncuesta(citaId: string) {
  await requireRol("ADMIN");
  await notificarEncuesta(citaId);
  revalidatePath("/panel", "layout");
}
