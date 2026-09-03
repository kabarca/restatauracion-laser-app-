import { z } from "zod";
import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { SERVICIO_SLUGS } from "@/lib/servicios";
import { crWallToUtc } from "@/lib/timezone";

/** Normaliza un teléfono a E.164 (+<país><número>). Lanza si es inválido. */
export function normalizarTelefono(input: string, pais?: string): string {
  const tel = parsePhoneNumberFromString(input, (pais as CountryCode) || undefined);
  if (!tel || !tel.isValid()) {
    throw new Error("Número de teléfono inválido.");
  }
  return tel.number; // E.164
}

const horaRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;

export const citaFormSchema = z
  .object({
    clienteNombre: z.string().trim().min(2, "Nombre muy corto").max(120),
    clienteEmail: z.string().trim().email("Correo inválido").max(160),
    clienteTelefono: z.string().trim().min(4, "Teléfono requerido"),
    clientePais: z.string().trim().length(2).optional(),
    fecha: z.string().regex(fechaRegex, "Fecha inválida (YYYY-MM-DD)"),
    hora: z.string().regex(horaRegex, "Hora inválida (HH:mm)"),
    servicio: z
      .string()
      .optional()
      .transform((v) => (v ? v : undefined))
      .refine((v) => v === undefined || SERVICIO_SLUGS.includes(v as never), "Servicio inválido"),
    nota: z.string().trim().max(1000).optional().or(z.literal("")),
    diasRecordatorio: z.coerce.number().int().min(0).max(30).optional(),
    recordatorioMismoDia: z
      .union([z.literal("on"), z.literal("true"), z.literal("")])
      .optional()
      .transform((v) => v === "on" || v === "true"),
  })
  .transform((data, ctx) => {
    let telefonoE164: string;
    try {
      telefonoE164 = normalizarTelefono(data.clienteTelefono, data.clientePais);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clienteTelefono"],
        message: "Número de teléfono inválido para el país seleccionado.",
      });
      return z.NEVER;
    }

    let fechaHora: Date;
    try {
      fechaHora = crWallToUtc(data.fecha, data.hora);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fecha"],
        message: "No se pudo interpretar la fecha y hora.",
      });
      return z.NEVER;
    }

    if (fechaHora.getTime() < Date.now() - 60_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fecha"],
        message: "La cita no puede ser en el pasado.",
      });
      return z.NEVER;
    }

    return {
      clienteNombre: data.clienteNombre,
      clienteEmail: data.clienteEmail,
      telefonoE164,
      fechaHora,
      servicio: data.servicio,
      nota: data.nota ? data.nota : undefined,
      diasRecordatorio: data.diasRecordatorio,
      recordatorioMismoDia: data.recordatorioMismoDia,
    };
  });

export type CitaFormInput = z.input<typeof citaFormSchema>;
export type CitaFormParsed = z.output<typeof citaFormSchema>;

export const reprogramarSchema = z
  .object({
    fecha: z.string().regex(fechaRegex),
    hora: z.string().regex(horaRegex),
  })
  .transform((data, ctx) => {
    let fechaHora: Date;
    try {
      fechaHora = crWallToUtc(data.fecha, data.hora);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Fecha/hora inválida", path: ["fecha"] });
      return z.NEVER;
    }
    return { fechaHora };
  });

export const usuarioSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  rol: z.enum(["ADMIN", "STAFF"]),
});
